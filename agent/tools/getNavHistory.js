import { tool } from "@openai/agents";
import { z } from "zod";
import { fetchNavHistory } from "../../api/services/mutualFund.service.js";

// Tool: Get NAV history using the mutual-fund API service.
export const getNavHistory = tool({
  name: "get_nav_history",
  description:
    "Get NAV history for a mutual fund. Returns historical NAV data with fund performance. Use interval parameter to control data granularity (1 for daily, 30 for monthly). Default navPeriod is '5Y', default interval is 1, default investedAmount is 1000.",
  parameters: z.object({
    fundId: z.string().describe("The fund ID (e.g., '100060')"),
    navPeriod: z
      .string()
      .default("5Y")
      .describe("Period for NAV history: '1M', '3M', '6M', '1Y', '3Y', '5Y' (default: '5Y')"),
    interval: z
      .number()
      .default(1)
      .describe("Interval in days between data points: 1 for daily data, 30 for monthly data (default: 1)"),
    investedAmount: z
      .number()
      .default(1000)
      .describe("Investment amount for calculation (default: 1000)"),
  }),
  async execute({ fundId, navPeriod, interval, investedAmount }) {
    console.log("🔨 Calling Get NAV History tool");
    try {
      const data = await fetchNavHistory(fundId, { navPeriod, interval, investedAmount });
      return JSON.stringify(data);
    } catch (error) {
      return JSON.stringify({ error: error.message });
    }
  },
});
