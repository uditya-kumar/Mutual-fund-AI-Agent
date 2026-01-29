import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import { runChat } from "./agent.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const API_BASE_URL = "https://upstocks-api.onrender.com";

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Serve index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Chat endpoint
app.post("/api/chat", async (req, res) => {
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

    // Run the agent
    const response = await runChat(message);

    // Check if response contains chart data
    if (response && response.includes('"type":"CHART"')) {
      try {
        const chartMatch = response.match(/\{"type":"CHART"[^}]+\}/);
        if (chartMatch) {
          const chartData = JSON.parse(chartMatch[0]);
          res.write(`data: ${JSON.stringify({ type: "chart", url: chartData.url })}\n\n`);
        }
      } catch (e) {
        // Not a chart, continue
      }
    }

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

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Mutual Fund AI Agent is running" });
});

// Search funds endpoint (proxy to avoid CORS)
app.get("/api/search-funds", async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.json([]);
  }

  try {
    const response = await axios.get(`${API_BASE_URL}/api/mutual-fund/search`, {
      params: { query, records: 10 }
    });

    const searchList = response.data?.data?.searchList || [];
    const funds = searchList
      .filter(item => item.type === "MF" && item.attributes)
      .map(item => ({
        schemeName: item.attributes.schemeName || item.attributes.tradingSymbol || "",
        schemeCode: item.attributes.instrumentKey || item.attributes.upstoxSchemeId || "",
        category: item.attributes.category || ""
      }))
      .filter(fund => fund.schemeName && fund.schemeCode);

    res.json(funds);
  } catch (error) {
    console.error("❌ Search error:", error.message);
    res.json([]);
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 Server running at http://localhost:${PORT}`);
  console.log(`📄 Open your browser to start chatting with the Mutual Fund AI Agent\n`);
});
