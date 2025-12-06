import express from "express";
import { agent } from "./agent.js";
import mutualFunds from "./mutualFund.js";
import { run } from "@openai/agents";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(__dirname));

// Endpoint to search mutual funds for autocomplete
app.get("/api/search-funds", (req, res) => {
  const query = req.query.q?.toLowerCase().trim() || "";
  
  if (!query) {
    return res.json([]);
  }

  const matches = mutualFunds
    .filter((fund) => fund.schemeName.toLowerCase().includes(query))
    .slice(0, 10)
    .map((fund) => ({
      schemeCode: fund.schemeCode,
      schemeName: fund.schemeName,
    }));

  res.json(matches);
});

// Endpoint to handle chat messages
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Set up SSE headers for streaming
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Send status updates
    const sendStatus = (status, data = {}) => {
      res.write(`data: ${JSON.stringify({ type: "status", status, ...data })}\n\n`);
    };

    // Override console.log to capture tool calls
    const originalLog = console.log;
    console.log = (...args) => {
      const logMessage = args.join(" ");
      if (logMessage.includes("🔨")) {
        sendStatus("tool_call", { tool: logMessage.replace("🔨 ", "") });
      }
      originalLog(...args);
    };

    sendStatus("thinking");

    const result = await run(agent, message);

    // Restore console.log
    console.log = originalLog;

    // Send the message (markdown passes through as-is)
    const finalContent = result.finalOutput.trim();
    res.write(`data: ${JSON.stringify({ type: "message", content: finalContent })}\n\n`);

    res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
    res.end();
  } catch (error) {
    console.error("Error:", error);
    res.write(`data: ${JSON.stringify({ type: "error", error: error.message })}\n\n`);
    res.end();
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📊 Mutual Fund Chat Interface Ready!`);
});
