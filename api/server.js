import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import chatRoute from "./routes/chat.route.js";
import healthRoute from "./routes/health.route.js";
import searchFundsRoute from "./routes/searchFunds.route.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Serve the built React frontend (run `npm run build` to produce it).
// api/ lives one level under the project root, hence the "..".
const staticDir = path.join(__dirname, "..", "frontend", "dist");

// Middleware
app.use(express.json());
app.use(express.static(staticDir));

// API routes — one file per route, all mounted under /api.
app.use("/api", chatRoute);
app.use("/api", healthRoute);
app.use("/api", searchFundsRoute);

// Serve index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(staticDir, "index.html"));
});

app.listen(PORT, () => {
  console.log(`\n🚀 Server running at http://localhost:${PORT}`);
  console.log(`📄 Open your browser to start chatting with the Mutual Fund AI Agent\n`);
});

export default app;
