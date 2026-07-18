import { Router } from "express";
import axios from "axios";
import { API_BASE_URL } from "../../agent/config.js";

const router = Router();

// GET /api/search-funds — proxy the upstream fund search (avoids browser CORS).
router.get("/search-funds", async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.json([]);
  }

  try {
    // Upstream returns stocks (SCRIP) before mutual funds, so request a larger
    // batch to ensure MF results are included, then trim to 10 after filtering.
    const response = await axios.get(`${API_BASE_URL}/api/mutual-fund/search`, {
      params: { query, records: 50 }
    });

    const searchList = response.data?.data?.searchList || [];
    const funds = searchList
      .filter(item => item.type === "MF" && item.attributes)
      .map(item => ({
        schemeName: item.attributes.schemeName || item.attributes.tradingSymbol || "",
        schemeCode: item.attributes.instrumentKey || item.attributes.upstoxSchemeId || "",
        category: item.attributes.category || ""
      }))
      .filter(fund => fund.schemeName && fund.schemeCode)
      .slice(0, 10);

    res.json(funds);
  } catch (error) {
    console.error("❌ Search error:", error.message);
    res.json([]);
  }
});

export default router;
