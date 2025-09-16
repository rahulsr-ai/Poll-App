// server/index.js - Make sure Socket.IO also saves to database
import express from "express";
import { PrismaClient } from "@prisma/client";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import PollsRouter from "./routes/PollRoutes.js";
import UserRouter from "./routes/UserRoute.js";
import VoteRouter from "./routes/VoteRoute.js";

const app = express();
const httpServer = createServer(app);
const prisma = new PrismaClient();

app.use(cors({ origin: "*", methods: ["GET", "POST", "PUT", "DELETE"], credentials: true }));

const io = new Server(httpServer, {
  cors: { origin: "*" },
});

app.use(express.json());

app.get("/", async (req, res) => {
  res.json({ message: "SERVER RUNNING WELL AND GOOD" });
});

app.use("/api", UserRouter);
app.use("/api", PollsRouter);
app.use("/api", VoteRouter);

// FIXED Socket.IO Setup
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-document", (docId) => {
    socket.join(`doc-${docId}`);
    console.log(`User joined document room: doc-${docId}`);
  });

  socket.on("joinAllPolls", () => {
    socket.join("allPolls");
    console.log(`User ${socket.id} joined allPolls room`);
  });

  socket.on("joinPoll", (pollId) => {
    socket.join(`poll_${pollId}`);
    console.log(`User ${socket.id} joined poll ${pollId}`);
  });

  // FIXED: Socket vote handler with proper database save
  socket.on("castVote", async (data) => {
    const { pollId, optionId, userId } = data;
    
    console.log(`🗳️ Socket vote attempt:`, { pollId, optionId, userId });

    try {
      // Validate inputs
      const parsedPollId = parseInt(pollId);
      const parsedUserId = parseInt(userId);
      const parsedOptionId = parseInt(optionId);

      if (isNaN(parsedPollId) || isNaN(parsedUserId) || isNaN(parsedOptionId)) {
        socket.emit("voteError", { 
          message: "Invalid data provided",
          pollId 
        });
        return;
      }

      // Check if poll exists
      const poll = await prisma.poll.findUnique({
        where: { id: parsedPollId },
        include: { options: true }
      });

      if (!poll) {
        socket.emit("voteError", { 
          message: "Poll not found",
          pollId 
        });
        return;
      }

      if (!poll.isPublished) {
        socket.emit("voteError", { 
          message: "Poll is not published yet",
          pollId 
        });
        return;
      }

      // Check if option belongs to poll
      const option = await prisma.pollOption.findUnique({
        where: { id: parsedOptionId }
      });

      if (!option || option.pollId !== parsedPollId) {
        socket.emit("voteError", { 
          message: "Invalid option for this poll",
          pollId 
        });
        return;
      }

      // Check if user already voted
      const existingVote = await prisma.vote.findFirst({
        where: {
          userId: parsedUserId,
          pollOption: {
            pollId: parsedPollId
          }
        }
      });

      if (existingVote) {
        socket.emit("voteError", { 
          message: "You have already voted on this poll",
          pollId 
        });
        return;
      }

      // 🔥 CREATE VOTE IN DATABASE - THIS WAS MISSING!
      const vote = await prisma.vote.create({
        data: {
          userId: parsedUserId,
          pollOptionId: parsedOptionId
        }
      });

      console.log('✅ Vote saved to database via Socket:', vote);

      // Get fresh poll data with updated vote counts
      const updatedPoll = await prisma.poll.findUnique({
        where: { id: parsedPollId },
        include: {
          options: {
            include: {
              _count: {
                select: { votes: true }
              }
            }
          },
          creator: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      // Calculate total votes
      const totalVotes = updatedPoll.options.reduce((sum, opt) => sum + opt._count.votes, 0);

      // Format poll data
      const formattedPoll = {
        id: updatedPoll.id,
        question: updatedPoll.question,
        isPublished: updatedPoll.isPublished,
        createdAt: updatedPoll.createdAt,
        updatedAt: updatedPoll.updatedAt,
        creator: updatedPoll.creator,
        totalVotes: totalVotes,
        options: updatedPoll.options.map(opt => ({
          id: opt.id,
          text: opt.text,
          votes: opt._count.votes, // This should now be > 0
          pollId: opt.pollId
        }))
      };

      console.log('📊 Broadcasting updated poll data:', formattedPoll);

      // Broadcast updated poll to all users
      io.to(`poll_${pollId}`).emit("pollUpdated", formattedPoll);
      io.to("allPolls").emit("pollUpdated", formattedPoll);
      
      // Send success confirmation
      socket.emit("voteSuccess", { 
        message: "Vote submitted successfully! 🎉",
        pollId: parsedPollId,
        vote: {
          id: vote.id,
          userId: vote.userId,
          optionId: vote.pollOptionId
        }
      });

      console.log(`✅ Vote processing complete for poll ${pollId}`);

    } catch (error) {
      console.error("❌ Socket vote error:", error);
      socket.emit("voteError", { 
        message: "Failed to submit vote. Please try again.",
        pollId,
        error: error.message
      });
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

httpServer.listen(5000, () => {
  console.log("🚀 Server running on http://localhost:5000");
  console.log("🔥 Socket.IO polling server ready");
});
