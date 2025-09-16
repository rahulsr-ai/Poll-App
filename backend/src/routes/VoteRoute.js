// routes/VoteRoute.js - Make sure vote is properly saved to database
import express from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = express.Router();

// POST /polls/:pollId/vote - HTTP endpoint (backup)
router.post("/:pollId/vote", async (req, res) => {
  try {
    const { pollId } = req.params;
    const { userId, optionId } = req.body;

    console.log('🗳️ HTTP Vote request:', { pollId, userId, optionId });

    // Validate inputs
    const parsedPollId = parseInt(pollId);
    const parsedUserId = parseInt(userId);
    const parsedOptionId = parseInt(optionId);

    if (isNaN(parsedPollId) || isNaN(parsedUserId) || isNaN(parsedOptionId)) {
      return res.status(400).json({ 
        success: false,
        error: "Invalid ID format" 
      });
    }

    // Check if poll exists
    const poll = await prisma.poll.findUnique({
      where: { id: parsedPollId },
      include: { options: true }
    });

    if (!poll) {
      return res.status(404).json({ 
        success: false,
        error: "Poll not found" 
      });
    }

    // Check if option belongs to this poll
    const option = await prisma.pollOption.findUnique({
      where: { id: parsedOptionId }
    });

    if (!option || option.pollId !== parsedPollId) {
      return res.status(400).json({ 
        success: false,
        error: "Invalid option for this poll" 
      });
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
      return res.status(400).json({ 
        success: false,
        error: "User has already voted on this poll" 
      });
    }

    // CREATE THE VOTE IN DATABASE
    const vote = await prisma.vote.create({
      data: {
        userId: parsedUserId,
        pollOptionId: parsedOptionId
      }
    });

    console.log('✅ Vote created in database:', vote);

    // Get updated poll with fresh vote counts
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

    // Format response
    const responseData = {
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
        votes: opt._count.votes, // This should be > 0 now
        pollId: opt.pollId
      }))
    };

    console.log('📊 Updated poll data with vote counts:', responseData);

    res.status(200).json({
      success: true,
      message: "Vote submitted successfully",
      data: responseData,
      vote: {
        id: vote.id,
        userId: vote.userId,
        optionId: vote.pollOptionId
      }
    });

  } catch (error) {
    console.error("❌ Vote creation error:", error);
    res.status(500).json({ 
      success: false,
      error: "Internal server error",
      message: error.message
    });
  }
});

// routes/VoteRoute.js - Add route to check user vote status
router.get("/:pollId/user/:userId/vote-status", async (req, res) => {
  try {
    const { pollId, userId } = req.params;
    
    const existingVote = await prisma.vote.findFirst({
      where: {
        userId: parseInt(userId),
        pollOption: {
          pollId: parseInt(pollId)
        }
      },
      include: {
        pollOption: {
          select: { id: true, text: true }
        }
      }
    });

    if (existingVote) {
      res.json({
        hasVoted: true,
        votedOptionId: existingVote.pollOptionId,
        votedOptionText: existingVote.pollOption.text
      });
    } else {
      res.json({
        hasVoted: false
      });
    }
  } catch (error) {
    console.error("Error checking vote status:", error);
    res.status(500).json({ error: "Server error" });
  }
});


export default router;
