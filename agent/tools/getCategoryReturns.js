import { tool } from "@openai/agents";
import { z } from "zod";
import axios from "axios";
import { API_BASE_URL } from "../config.js";

// Tool: Get category returns comparison using hosted API
export const getCategoryReturns = tool({
  name: "get_category_returns",
  description:
    "Get category returns comparison for a mutual fund. Compare the fund's performance against its category average. Use interval parameter to control data granularity. Default navPeriod is '5Y', default interval is 30.",
  parameters: z.object({
    fundId: z.string().describe("The fund ID (e.g., '100060')"),
    navPeriod: z
      .string()
      .default("5Y")
      .describe("Period for comparison: '1M', '3M', '6M', '1Y', '3Y', '5Y' (default: '5Y')"),
    interval: z
      .number()
      .default(30)
      .describe("Interval in days between data points: 1 for daily data, 30 for monthly data (default: 30)"),
  }),
  async execute({ fundId, navPeriod, interval }) {
    console.log("🔨 Calling Get Category Returns tool");
    try {
      const response = await axios.get(`${API_BASE_URL}/api/mutual-fund/${fundId}/category-returns`, {
        params: { navPeriod, interval }
      });
      return JSON.stringify(response.data);
    } catch (error) {
      return JSON.stringify({ error: error.message });
    }
  },
});
