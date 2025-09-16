// wsServer.js
import WebSocket from "ws";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ✅ Singleton WebSocket Server (avoid multiple instances)
let wss;
if (!global.wss) {
  wss = new WebSocket.Server({ port: 8080 });
  global.wss = wss;

  wss.on("connection", (ws) => {
    console.log("Client connected to WS");

    ws.on("close", () => {
      console.log("Client disconnected from WS");
    });
  });
} else {
  wss = global.wss;
}

// Helper to broadcast updates
export const broadcastVoteUpdate = async (pollId) => {
  const pollOptions = await prisma.pollOption.findMany({
    where: { pollId },
    select: { id: true, text: true, votes: { select: { id: true } } },
  });

  const data = pollOptions.map((opt) => ({
    id: opt.id,
    text: opt.text,
    voteCount: opt.votes.length,
  }));

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ pollId, options: data }));
    }
  });
};

export { wss };
