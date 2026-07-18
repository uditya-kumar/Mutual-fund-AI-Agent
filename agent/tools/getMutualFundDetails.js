import { tool } from "@openai/agents";
import { z } from "zod";
import { fetchFundDetails } from "../../api/services/mutualFund.service.js";

// Tool: Get mutual fund details using the mutual-fund API service.
export const getMutualFundDetails = tool({
  name: "get_mutual_fund_details",
  description:
    "Get detailed information about a specific mutual fund including current NAV, returns, and fund details. Use the fundSlug from search results (e.g., 'parag-parikh-flexi-cap-direct-growth-100060').",
  parameters: z.object({
    fundSlug: z.string().describe("The fund slug (e.g., 'parag-parikh-flexi-cap-direct-growth-100060'). This should be obtained from search_mutual_funds results."),
  }),
  async execute({ fundSlug }) {
    console.log("🔨 Calling Get Mutual Fund Details tool");
    try {
      // Clean up the slug if needed
      const cleanSlug = fundSlug.trim().toLowerCase().replace(/\s+/g, '-');
      console.log(`Fetching fund data for: ${cleanSlug}`);

      const data = await fetchFundDetails(cleanSlug);

      if (!data || Object.keys(data).length === 0) {
        return JSON.stringify({
          error: "No data found for this fund",
          suggestion: "Please verify the fund slug is correct. Try searching for the fund first using search_mutual_funds.",
          attemptedSlug: cleanSlug
        });
      }

      return JSON.stringify(data);
    } catch (error) {
      return JSON.stringify({
        error: error.message,
        suggestion: "The fund slug might be incorrect. Try searching for the fund first using search_mutual_funds to get the correct slug.",
        attemptedSlug: fundSlug
      });
    }
  },
});
