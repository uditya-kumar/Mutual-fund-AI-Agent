import { tool } from "@openai/agents";
import { z } from "zod";
import { searchFunds } from "../../api/services/mutualFund.service.js";

// Helper: convert a fund name to slug format.
function nameToSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens
}

// Helper: build a fund slug from schemeName and schemeCode.
function buildFundSlugFromSearch(schemeName, schemeCode) {
  if (!schemeName || !schemeCode) return null;
  const slug = nameToSlug(schemeName);
  return `${slug}-${schemeCode}`;
}

// Tool: Search for mutual funds using the mutual-fund API service.
export const searchMutualFunds = tool({
  name: "search_mutual_funds",
  description:
    "Search for mutual funds by name or keyword using the API. Returns matching funds with fund IDs and details.",
  parameters: z.object({
    query: z
      .string()
      .describe("The search term to find mutual funds (name or keyword)"),
  }),
  async execute({ query }) {
    console.log("🔨 Calling Search tool");
    try {
      const data = await searchFunds(query);

      // Get results from data.data.searchList
      // Raw API format: { type: "SCRIP", attributes: { instrumentKey, name, segment, ... } }
      const searchList = data?.data?.searchList || [];

      if (searchList.length === 0) {
        return JSON.stringify({
          status: "not_found",
          message: `No mutual funds found matching "${query}". Please try a different keyword.`,
          matchCount: 0,
        });
      }

      // Transform raw API results to normalized format
      const normalizedResults = searchList
        .filter(item => item.attributes) // Ensure attributes exist
        .map(item => {
          const attrs = item.attributes;
          return {
            schemeCode: attrs.instrumentKey || attrs.isin || '',
            schemeName: attrs.name || attrs.shortName || attrs.tradingSymbol || '',
            tradingSymbol: attrs.tradingSymbol || '',
            segment: attrs.segment || '',
            exchange: attrs.exchange || '',
          };
        })
        .filter(fund => fund.schemeName); // Filter out items without a name

      // Filter only mutual fund results (segment === "MF")
      const mutualFunds = normalizedResults.filter(item => item.segment === "MF");

      if (mutualFunds.length === 0) {
        return JSON.stringify({
          status: "not_found",
          message: `No mutual funds found matching "${query}". Please try a different keyword.`,
          matchCount: 0,
        });
      }

      if (mutualFunds.length === 1) {
        const fund = mutualFunds[0];
        const fundId = fund.schemeCode;
        const fundSlug = buildFundSlugFromSearch(fund.schemeName, fund.schemeCode);

        return JSON.stringify({
          status: "single_match",
          message: `Found exact match for "${query}"`,
          matchCount: 1,
          fund: {
            fundId: fundId,
            fundName: fund.schemeName,
            fundSlug: fundSlug,
          },
        });
      }

      return JSON.stringify({
        status: "multiple_matches",
        message: `Found ${mutualFunds.length} mutual funds matching "${query}". Here are the top 15:`,
        matchCount: mutualFunds.length,
        funds: mutualFunds.slice(0, 15).map((fund, index) => ({
          index: index + 1,
          fundId: fund.schemeCode,
          fundName: fund.schemeName,
          fundSlug: buildFundSlugFromSearch(fund.schemeName, fund.schemeCode),
        })),
      });
    } catch (error) {
      return JSON.stringify({ error: error.message });
    }
  },
});
