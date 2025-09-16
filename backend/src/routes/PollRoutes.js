import express from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const PollsRoute = express.Router();

// Create Polls route => /api/create/polls
PollsRoute.post("/create/polls", async (req, res) => {
  try {
    const { question, creatorId, options , isPublished} = req.body;

    // options: array of text, e.g., ["Option 1", "Option 2"]
    if (!question || !creatorId || !options || !Array.isArray(options)) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // 1. Check duplicate
    const existingPoll = await prisma.poll.findFirst({
      where: {
        creatorId,
        question,
      },
    });

    if (existingPoll) {
      return res
        .status(400)
        .json({ error: "You have already created this poll!" });
    }


    const poll = await prisma.poll.create({
      data: {
        question,
        creatorId,
        options: {
          create: options.map((text) => ({ text })),
        },
        isPublished
      },
      include: {
        options: true, // return created options
      },
    });

    res.status(201).json(poll);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});



// Get polls with options AND vote counts, route => /api/polls
PollsRoute.get("/polls", async (req, res) => {
  try {
    console.log("🔍 Fetching polls with vote counts...");
    
    const polls = await prisma.poll.findMany({
      where: {
        isPublished: true  // Only show published polls
      },
      include: {
        options: {
          include: {
            _count: {
              select: {
                votes: true  // ✅ YE MISSING THA! Vote count include karo
              }
            }
          }
        },
        creator: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    // Format response to match frontend expectations
    const formattedPolls = polls.map(poll => {
      const formattedOptions = poll.options.map(option => ({
        id: option.id,
        text: option.text,
        votes: option._count?.votes || 0,  // ✅ Vote count add karo
        pollId: option.pollId
      }));

      const totalVotes = formattedOptions.reduce((sum, opt) => sum + opt.votes, 0);

      return {
        id: poll.id,
        question: poll.question,
        isPublished: poll.isPublished,
        createdAt: poll.createdAt,
        updatedAt: poll.updatedAt,
        creator: poll.creator,
        totalVotes: totalVotes,  // ✅ Total votes add karo
        options: formattedOptions
      };
    });

    console.log(`📊 Returning ${formattedPolls.length} polls with vote counts`);
    
    // Debug: Log vote counts for each poll
    formattedPolls.forEach(poll => {
      console.log(`Poll ${poll.id} "${poll.question}": ${poll.totalVotes} total votes`);
      poll.options.forEach(option => {
        console.log(`  - "${option.text}": ${option.votes} votes`);
      });
    });

    res.json(formattedPolls);
  } catch (err) {
    console.error("❌ Error fetching polls:", err);
    res.status(500).json({ 
      error: "Server error",
      message: err.message 
    });
  }
});

// Get single poll with vote counts
PollsRoute.get("/polls/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const pollId = parseInt(id);

    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        options: {
          include: {
            _count: {
              select: { votes: true }
            }
          }
        },
        creator: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    if (!poll) {
      return res.status(404).json({ error: "Poll not found" });
    }

    // Format single poll response
    const formattedOptions = poll.options.map(option => ({
      id: option.id,
      text: option.text,
      votes: option._count?.votes || 0,
      pollId: option.pollId
    }));

    const totalVotes = formattedOptions.reduce((sum, opt) => sum + opt.votes, 0);

    const formattedPoll = {
      id: poll.id,
      question: poll.question,
      isPublished: poll.isPublished,
      createdAt: poll.createdAt,
      updatedAt: poll.updatedAt,
      creator: poll.creator,
      totalVotes: totalVotes,
      options: formattedOptions
    };

    res.json(formattedPoll);
  } catch (err) {
    console.error("❌ Error fetching poll:", err);
    res.status(500).json({ 
      error: "Server error",
      message: err.message 
    });
  }
});


export default PollsRoute;
