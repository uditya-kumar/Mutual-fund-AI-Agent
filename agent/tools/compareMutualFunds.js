import { tool } from "@openai/agents";
import { z } from "zod";
import { fetchCategoryReturns } from "../../api/services/mutualFund.service.js";

// Tool: Compare multiple mutual funds using the mutual-fund API service.
export const compareMutualFunds = tool({
  name: "compare_mutual_funds",
  description:
    "Compare multiple mutual funds based on their performance metrics.",
  parameters: z.object({
    fundIds: z
      .array(z.string())
      .describe("Array of fund IDs to compare (e.g., ['100060', '119551'])"),
  }),
  async execute({ fundIds }) {
    console.log("🔨 Calling Compare Mutual Funds tool");
    try {
      const comparisons = [];

      for (const fundId of fundIds) {
        try {
          const data = await fetchCategoryReturns(fundId, { navPeriod: "5Y" });
          comparisons.push({
            fundId: fundId,
            fundName: data.data?.fundName || `Fund ${fundId}`,
            category: data.data?.category,
            returns: data.data?.returns,
            categoryAvg: data.data?.categoryAverage,
            data: data.data,
          });
        } catch (err) {
          comparisons.push({ fundId: fundId, error: err.message });
        }
      }

      return JSON.stringify(comparisons);
    } catch (error) {
      return JSON.stringify({ error: error.message });
    }
  },
});
