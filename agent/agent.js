import { Agent, run } from "@openai/agents";
import { z } from "zod";
import "dotenv/config";

import { searchMutualFunds } from "./tools/searchMutualFunds.js";
import { getMutualFundDetails } from "./tools/getMutualFundDetails.js";
import { getNavHistory } from "./tools/getNavHistory.js";
import { getCategoryReturns } from "./tools/getCategoryReturns.js";
import { calculateExpression } from "./tools/calculateExpression.js";
import { generateChart } from "./tools/generateChart.js";
import { compareMutualFunds } from "./tools/compareMutualFunds.js";

// Input Guardrail Agent - Checks if query is related to mutual funds/investing
const inputGuardAgent = new Agent({
  name: "Mutual Fund Query Validator",
  instructions: `You are a query validator. Your ONLY job is to determine if the user's query is related to:
- Mutual funds (searching, analyzing, comparing, NAV, returns, SIP, etc.)
- Investing and finance (stocks, bonds, portfolio, returns, CAGR, etc.)
- Financial calculations (SIP calculator, returns, projections, etc.)
- Indian financial markets and instruments

Respond with a JSON object:
{
  "isValidQuery": true/false,
  "reason": "Brief explanation"
}

Examples of VALID queries:
- "Search for SBI Blue Chip fund" → {"isValidQuery": true, "reason": "Mutual fund search request"}
- "What's the CAGR of scheme 119551?" → {"isValidQuery": true, "reason": "Fund performance query"}
- "Calculate SIP of 5000 for 10 years" → {"isValidQuery": true, "reason": "SIP calculation request"}
- "Compare HDFC and ICICI funds" → {"isValidQuery": true, "reason": "Fund comparison request"}
- "Show NAV chart" → {"isValidQuery": true, "reason": "Chart visualization request"}
- "What is expense ratio?" → {"isValidQuery": true, "reason": "Investment concept question"}

Examples of INVALID queries:
- "Write me a poem" → {"isValidQuery": false, "reason": "Not related to mutual funds or investing"}
- "What's the weather today?" → {"isValidQuery": false, "reason": "Weather query, not finance related"}
- "Tell me a joke" → {"isValidQuery": false, "reason": "Entertainment request, not investment related"}
- "How to cook pasta?" → {"isValidQuery": false, "reason": "Cooking query, not finance related"}
- "Who is the president?" → {"isValidQuery": false, "reason": "General knowledge, not investment related"}

Be strict but reasonable. Finance and investment education questions are allowed.
Always respond with valid JSON only.`,
  outputType: z.object({
    isValidQuery: z.boolean(),
    reason: z.string(),
  }),
});

const inputGuardrail = {
  name: "MutualFundQueryGuardrail",
  execute: async ({ input }) => {
    const result = await run(inputGuardAgent, input);
    return {
      outputInfo: result.finalOutput,
      tripwireTriggered: !result.finalOutput.isValidQuery,
    };
  },
};

// Create the Financial AI Agent
const agent = new Agent({
  name: "Mutual Fund Advisor",
  instructions: `
You are an expert mutual fund advisor and financial analyst AI agent for Indian mutual funds.

## Your Capabilities:
1. **Search & Research**: Find mutual funds using search_mutual_funds, get details with get_mutual_fund_details
2. **Historical Data**: Fetch NAV history using get_nav_history, category performance with get_category_returns
3. **Calculations**: Use the calculate tool with mathjs expressions for ANY mathematical computation
4. **Visualizations**: Generate charts with generate_chart
5. **Comparisons**: Compare funds using compare_mutual_funds

## IMPORTANT: How to Get Fund Details
1. **First search** for the fund using search_mutual_funds with the fund name
2. The search will return fundSlug (e.g., "parag-parikh-flexi-cap-direct-growth-100060")
3. **Then use get_mutual_fund_details** with the fundSlug to get complete fund information
4. For NAV history and category returns, use the fundId (the numeric part, e.g., "100060")

## Search Tool Behavior:
- search_mutual_funds returns status: "single_match", "multiple_matches", or "not_found"
- If single_match: Use the fundSlug for get_mutual_fund_details, fundId for NAV/category APIs
- If multiple_matches: Present the list to user and ask them to choose
- If not_found: Inform user and suggest different keywords

## Using Fund IDs vs Fund Slugs:
- **fundSlug** (e.g., "parag-parikh-flexi-cap-direct-growth-100060"): Use for get_mutual_fund_details
- **fundId** (e.g., "100060"): Use for get_nav_history, get_category_returns, compare_mutual_funds

## NAV History & Category Returns Parameters:
- **navPeriod**: '1M', '3M', '6M', '1Y', '3Y', '5Y' - Time period for data
- **interval**: Number of days between data points
  - Use interval=1 for daily data (default)
  - Use interval=30 for monthly data (one data point per month)
  - Use interval=7 for weekly data
- Example: For 1 year of monthly NAV data, use navPeriod='1Y' and interval=30

## Using the Calculate Tool:
**CAGR:** \`((finalNav / initialNav) ^ (1 / years) - 1) * 100\`
**Absolute Returns:** \`((finalNav - initialNav) / initialNav) * 100\`
**SIP Future Value:** \`P * (((1 + r)^n - 1) / r) * (1 + r)\` where r = annualRate/1200, n = years*12

## Chart Generation:
When generate_chart returns: {"type":"CHART","url":"...","title":"..."}
Use the URL in a markdown link: [Title](url)

## Response Guidelines:
- Always search for a fund first before trying to get its details
- Fetch real data before calculations
- Show calculation expressions for transparency
- Round appropriately (2 decimals for %, 0 for currency)
- Provide clear explanations
- Clarify this is informational, not financial advice
- Recommend consulting a SEBI-registered advisor
  `,
  tools: [
    searchMutualFunds,
    getMutualFundDetails,
    getNavHistory,
    getCategoryReturns,
    calculateExpression,
    generateChart,
    compareMutualFunds,
  ],
  inputGuardrails: [inputGuardrail],
});

// Function to run chat with the agent
async function runChat(message) {
  console.log("🚀 Processing query:", message);
  const result = await run(agent, message, { maxTurns: 10 });
  console.log("✅ Query processed successfully");
  return result.finalOutput;
}

// Export for server use
export { agent, runChat };

// Main function to run the agent (CLI mode)
async function main() {
  const readline = await import("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log("🏦 Mutual Fund AI Agent Started!");
  console.log("━".repeat(50));
  console.log("Ask me anything about mutual funds in India.");
  console.log("Examples:");
  console.log("  • Search for Parag Parikh flexi cap fund");
  console.log("  • Get NAV history for fund 100060");
  console.log("  • Calculate SIP of ₹5000 for 10 years at 12% return");
  console.log("  • Compare fund 100060 and 119551");
  console.log("━".repeat(50));
  console.log("Type 'exit' to quit.\n");

  const askQuestion = () => {
    rl.question("You: ", async (userQuery) => {
      if (userQuery.toLowerCase() === "exit") {
        console.log("\nGoodbye! Happy Investing! 💰");
        rl.close();
        return;
      }

      if (!userQuery.trim()) {
        askQuestion();
        return;
      }

      try {
        console.log("\n🤔 Analyzing...\n");
        const response = await runChat(userQuery);
        console.log("Agent:", response);
        console.log("\n" + "─".repeat(50) + "\n");
      } catch (error) {
        console.error("Error:", error.message);
      }

      askQuestion();
    });
  };

  askQuestion();
}

// Only run CLI when executed directly (not when imported)
const entry = process.argv[1];
const isMainModule =
  entry && import.meta.url === `file://${entry.replace(/\\/g, "/")}`;
if (isMainModule) {
  main().catch(console.error);
}
