import { Router } from "express";

const router = Router();

// GET /api/health — simple liveness check.
router.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Mutual Fund AI Agent is running" });
});

export default router;
