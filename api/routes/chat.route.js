import { Router } from "express";
import { runChat } from "../../agent/agent.js";

const router = Router();

// POST /api/chat — run the agent and stream the result back as SSE frames.
router.post("/chat", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  // Set up SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");

  try {
    console.log("📥 Received message:", message);

    // Send thinking status
    res.write(`data: ${JSON.stringify({ type: "status", status: "thinking" })}\n\n`);

    // Run the agent. Any chart is embedded inline in the response as a
    // ```chart fenced code block, which the frontend parses and renders.
    const response = await runChat(message);

    // Send the message
    res.write(`data: ${JSON.stringify({ type: "message", content: response })}\n\n`);
    res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);

  } catch (error) {
    console.error("❌ Error processing chat:", error);
    res.write(`data: ${JSON.stringify({ type: "error", error: error.message })}\n\n`);
  } finally {
    res.end();
  }
});

export default router;
