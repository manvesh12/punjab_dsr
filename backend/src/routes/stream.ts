import { Router } from "express";
import { Redis } from "ioredis";

export const streamRouter = Router();

// Configure Redis subscriber (in production, use environment variables)
const redisHost = process.env.REDIS_HOST || "127.0.0.1";
const redisPort = Number(process.env.REDIS_PORT) || 6379;

const redisSubscriber = new Redis({
  host: redisHost,
  port: redisPort,
});

// We can have a publisher to manually publish events for testing
const redisPublisher = new Redis({
  host: redisHost,
  port: redisPort,
});

// GET /api/stream/events
// Standard Server-Sent Events (SSE) endpoint
streamRouter.get("/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  // Send initial connection heartbeat
  res.write("data: {\"status\": \"connected\"}\n\n");

  const channel = "dsr_progress_events";

  // Define message handler
  const handleMessage = (ch: string, message: string) => {
    if (ch === channel) {
      // Stream the raw JSON message to the client
      res.write(`data: ${message}\n\n`);
    }
  };

  // Subscribe to Redis channel
  redisSubscriber.subscribe(channel, (err: any) => {
    if (err) {
      console.error("Failed to subscribe to Redis channel:", err);
    }
  });

  redisSubscriber.on("message", handleMessage);

  // Handle client disconnect
  req.on("close", () => {
    redisSubscriber.off("message", handleMessage);
    res.end();
  });
});

// POST /api/stream/publish
// Simulates a background worker publishing progress updates
streamRouter.post("/publish", async (req, res) => {
  try {
    const { projectId, action, progress, message } = req.body;
    
    if (!projectId) {
      res.status(400).json({ error: "projectId is required" });
      return;
    }

    const payload = JSON.stringify({
      projectId,
      action: action || "PROCESSING",
      progress: progress || 0,
      message: message || "Working...",
      timestamp: new Date().toISOString()
    });

    await redisPublisher.publish("dsr_progress_events", payload);
    
    res.json({ success: true, published: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
