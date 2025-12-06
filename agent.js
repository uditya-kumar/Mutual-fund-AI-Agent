import { google } from "@ai-sdk/google";
import { Agent, run, setDefaultOpenAIClient } from "@openai/agents";
import { aisdk } from "@openai/agents-extensions";
import { tool } from "@openai/agents";
import { z } from "zod";
import OpenAI from "openai";
import { create, all } from "mathjs";
import mutualFunds from "./mutualFund.js";
import "dotenv/config";

// Initialize mathjs with all functions
const math = create(all);

// Create a Gemini model instance using the AI SDK adapter
const model = aisdk(google("gemini-2.5-flash"));

// Input Guardrail Agent - Checks if query is related to mutual funds/investing
const inputGuardAgent = new Agent({
  name: "Mutual Fund Query Validator",
  model: model,
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

// Tool: Search for mutual funds by name (LOCAL SEARCH - FAST)
const searchMutualFunds = tool({
  name: "search_mutual_funds",
  description:
    "Search for mutual funds by name or keyword using local database. Returns matching funds with scheme codes. If multiple matches found, user should be asked to choose. If single match, proceed automatically. If no match, inform user.",
  parameters: z.object({
    query: z
      .string()
      .describe("The search term to find mutual funds (name or keyword)"),
  }),
  async execute({ query }) {
    console.log("🔨Calling Search tool");
    try {
      const searchTerm = query.toLowerCase().trim();

      // Search in local mutualFunds data
      const matches = mutualFunds.filter((fund) =>
        fund.schemeName.toLowerCase().includes(searchTerm)
      );

      if (matches.length === 0) {
        return JSON.stringify({
          status: "not_found",
          message: `No mutual funds found matching "${query}". Please try a different keyword or fund name.`,
          matchCount: 0,
        });
      }

      if (matches.length === 1) {
        return JSON.stringify({
          status: "single_match",
          message: `Found exact match for "${query}"`,
          matchCount: 1,
          fund: {
            schemeCode: matches[0].schemeCode,
            schemeName: matches[0].schemeName,
          },
        });
      }

      // Multiple matches - return top 15 for user selection
      return JSON.stringify({
        status: "multiple_matches",
        message: `Found ${matches.length} mutual funds matching "${query}". Here are the top 15:`,
        matchCount: matches.length,
        funds: matches.slice(0, 15).map((fund, index) => ({
          index: index + 1,
          schemeCode: fund.schemeCode,
          schemeName: fund.schemeName,
        })),
      });
    } catch (error) {
      return JSON.stringify({ error: error.message });
    }
  },
});

// Tool: Get mutual fund details and NAV history
const getMutualFundDetails = tool({
  name: "get_mutual_fund_details",
  description:
    "Get detailed information about a specific mutual fund including current NAV and historical data. Use scheme code obtained from search.",
  parameters: z.object({
    schemeCode: z.string().describe("The scheme code of the mutual fund"),
  }),
  async execute({ schemeCode }) {
    console.log("🔨 Calling Get Mutual Fund Details tool");
    try {
      const response = await fetch(`https://api.mfapi.in/mf/${schemeCode}`);
      const data = await response.json();
      return JSON.stringify({
        meta: data.meta,
        currentNav: data.data?.[0],
        recentNavHistory: data.data?.slice(0, 30),
      });
    } catch (error) {
      return JSON.stringify({ error: error.message });
    }
  },
});

// Tool: Get NAV history for a date range
const getNavHistory = tool({
  name: "get_nav_history",
  description:
    "Get NAV history for a mutual fund. Returns historical NAV data.",
  parameters: z.object({
    schemeCode: z.string().describe("The scheme code of the mutual fund"),
    limit: z
      .number()
      .optional()
      .describe("Number of historical records to fetch (default 365)"),
  }),
  async execute({ schemeCode, limit = 365 }) {
    console.log("🔨 Calling Get NAV History tool");
    try {
      console.log("🔨 Fetching data");
      const response = await fetch(`https://api.mfapi.in/mf/${schemeCode}`);
      console.log("🔨 Got the data!!");
      const data = await response.json();
      return JSON.stringify({
        meta: data.meta,
        navHistory: data.data?.slice(0, limit),
      });
    } catch (error) {
      return JSON.stringify({ error: error.message });
    }
  },
});

// 🔥 NEW: Single powerful math expression evaluator
const calculateExpression = tool({
  name: "calculate",
  description: `Evaluate any mathematical expression using mathjs. Supports:
- Basic operations: +, -, *, /, ^, sqrt(), abs(), round()
- Statistics: mean(), median(), std(), variance(), min(), max(), sum()
- Financial: Use formulas like CAGR = ((finalValue/initialValue)^(1/years) - 1) * 100
- SIP Future Value: P * (((1 + r)^n - 1) / r) * (1 + r) where r = annual_rate/1200, n = years*12
- Arrays: [1, 2, 3] for statistical operations
- Constants: pi, e
- Functions: log(), exp(), sin(), cos(), pow(), etc.

Pass the expression as a string and optionally provide variables as an object.`,
  parameters: z.object({
    expression: z
      .string()
      .describe(
        "Mathematical expression to evaluate (e.g., '((150/100)^(1/5) - 1) * 100' for CAGR)"
      ),
    variables: z
      .record(z.union([z.number(), z.array(z.number())]))
      .optional()
      .describe(
        "Optional variables object, e.g., {principal: 10000, rate: 12, years: 5}"
      ),
  }),
  async execute({ expression, variables = {} }) {
    console.log("🔨 Calling Calculate Expression tool");
    try {
      // Create a scope with the provided variables
      const scope = { ...variables };

      // Evaluate the expression
      const result = math.evaluate(expression, scope);

      // Format the result
      let formattedResult;
      if (typeof result === "number") {
        formattedResult = math.round(result, 6);
      } else if (Array.isArray(result)) {
        formattedResult = result.map((r) =>
          typeof r === "number" ? math.round(r, 6) : r
        );
      } else {
        formattedResult = result;
      }

      return JSON.stringify({
        expression: expression,
        variables: variables,
        result: formattedResult,
      });
    } catch (error) {
      return JSON.stringify({
        error: error.message,
        hint: "Check expression syntax. Use * for multiplication, ^ for power, and proper parentheses.",
      });
    }
  },
});

// Tool: Generate charts using QuickChart.io API
const generateChart = tool({
  name: "generate_chart",
  description:
    "Generate visual charts for mutual fund data using QuickChart. Returns a short chart URL.",
  parameters: z.object({
    chartType: z
      .string()
      .describe(
        "Type of chart to generate. Allowed values: line, bar, pie, doughnut, radar"
      ),
    title: z.string().describe("Chart title"),
    labels: z
      .array(z.string())
      .describe("Labels for the data points (e.g., dates, categories)"),
    datasets: z
      .array(
        z.object({
          label: z.string().describe("Dataset label"),
          data: z.array(z.number()).describe("Data values"),
        })
      )
      .describe("Datasets to plot"),
  }),
  async execute({ chartType, title, labels, datasets }) {
    console.log("🔨 Calling Generate Chart tool");
    try {
      const chartConfig = {
        type: chartType,
        data: {
          labels: labels,
          datasets: datasets.map((ds, index) => ({
            label: ds.label,
            data: ds.data,
            borderColor: `hsl(${index * 60}, 70%, 50%)`,
            backgroundColor: `hsla(${index * 60}, 70%, 50%, 0.2)`,
            fill: chartType === "line" ? true : undefined,
            tension: chartType === "line" ? 0.4 : undefined,
          })),
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: title,
              font: { size: 16 },
              color: "#e8e8e8",
            },
            legend: {
              display: true,
              position: "bottom",
              labels: {
                color: "#e8e8e8",
              },
            },
          },
          scales:
            chartType === "line" || chartType === "bar"
              ? {
                  y: {
                    beginAtZero: false,
                    ticks: { color: "#888" },
                    grid: { color: "#2a2a2a" },
                  },
                  x: {
                    ticks: { color: "#888" },
                    grid: { color: "#2a2a2a" },
                  },
                }
              : undefined,
        },
      };

      // Use QuickChart short URL API for cleaner URLs
      const response = await fetch("https://quickchart.io/chart/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          backgroundColor: "black",
          width: 800,
          height: 400,
          chart: chartConfig,
        }),
      });

      const result = await response.json();

      if (result.success && result.url) {
        return JSON.stringify({
          type: "CHART",
          url: result.url,
          title: title,
          message:
            "Chart created successfully. Use this URL in a markdown link.",
        });
      } else {
        // Fallback to long URL if short URL fails
        const chartUrl = `https://quickchart.io/chart?backgroundColor=black&c=${encodeURIComponent(
          JSON.stringify(chartConfig)
        )}&w=800&h=400`;

        return JSON.stringify({
          type: "CHART",
          url: chartUrl,
          title: title,
          message:
            "Chart created successfully. Use this URL in a markdown link.",
        });
      }
    } catch (error) {
      return JSON.stringify({ error: error.message });
    }
  },
});

// Tool: Compare multiple mutual funds
const compareMutualFunds = tool({
  name: "compare_mutual_funds",
  description:
    "Compare multiple mutual funds based on their performance metrics. Returns NAV data for comparison.",
  parameters: z.object({
    schemeCodes: z
      .array(z.string())
      .describe("Array of scheme codes to compare"),
  }),
  async execute({ schemeCodes }) {
    console.log("🔨 Calling Compare Mutual Funds tool");
    try {
      const comparisons = [];

      for (const code of schemeCodes) {
        const response = await fetch(`https://api.mfapi.in/mf/${code}`);
        const data = await response.json();

        if (data.data && data.data.length > 0) {
          const navHistory = data.data.slice(0, 365);
          const navValues = navHistory.map((d) => parseFloat(d.nav));

          comparisons.push({
            schemeName: data.meta?.scheme_name,
            schemeCode: code,
            category: data.meta?.scheme_category,
            currentNav: navValues[0],
            nav1WeekAgo: navValues[7] || null,
            nav1MonthAgo: navValues[30] || null,
            nav1YearAgo: navValues[navValues.length - 1] || null,
            navValues: navValues.slice(0, 30), // Last 30 NAVs for calculations
          });
        }
      }

      return JSON.stringify(comparisons);
    } catch (error) {
      return JSON.stringify({ error: error.message });
    }
  },
});

// Create the Financial AI Agent
const agent = new Agent({
  name: "Mutual Fund Advisor",
  model: model,
  instructions: `
  You are an expert mutual fund advisor and financial analyst AI agent for Indian mutual funds.

## Your Capabilities:
1. **Search & Research**: Find mutual funds using search_mutual_funds (LOCAL - fast keyword search), get details with get_mutual_fund_details
2. **Historical Data**: Fetch NAV history using get_nav_history
3. **Calculations**: Use the calculate tool with mathjs expressions for ANY mathematical computation
4. **Visualizations**: Generate charts with generate_chart
5. **Comparisons**: Compare funds using compare_mutual_funds

## Search Tool Behavior:
- search_mutual_funds returns status field: "single_match", "multiple_matches", or "not_found"
- If single_match: Automatically use the schemeCode for next steps
- If multiple_matches: Present the list to user and ask them to choose by name or number
- If not_found: Inform user and suggest trying different keywords

## Using the Calculate Tool:
The calculate tool accepts any mathjs expression. Use it for:

**CAGR (Compound Annual Growth Rate):**
\`((finalNav / initialNav) ^ (1 / years) - 1) * 100\`

**Absolute Returns:**
\`((finalNav - initialNav) / initialNav) * 100\`

**SIP Future Value:**
\`P * (((1 + r)^n - 1) / r) * (1 + r)\` where r = annualRate/1200, n = years*12

**Required SIP for Target:**
\`targetAmount / ((((1 + r)^n - 1) / r) * (1 + r))\`

**Volatility (Standard Deviation):**
\`std([array of daily returns]) * sqrt(252) * 100\` for annualized

**Statistics on NAV array:**
\`mean([nav1, nav2, ...])\`, \`std([...])\`, \`min([...])\`, \`max([...])\`

You can pass variables: {"principal": 10000, "rate": 12} and use them in expression: "principal * (1 + rate/100)^5"

## Chart Generation (Markdown links):
When you call the generate_chart tool, it returns JSON like:
{"type":"CHART","url":"https://quickchart.io/chart/render/abcd1234","title":"...","message":"..."}

The URL is a SHORT URL that you can easily use in markdown.

How to respond:
1) Parse the tool result JSON
2) Create a markdown link using the url and title: [Title](url)
3) Integrate the link naturally in the response text

Example:
Tool returns: {"type":"CHART","url":"https://quickchart.io/chart/render/abc123","title":"Fund NAV Trend","message":"..."}

Your response should include:
"Here is the NAV trend chart:
[Fund NAV Trend](https://quickchart.io/chart/render/abc123)

Performance Summary..."

Guidelines:
- Use the exact URL from the tool result (it's short and clean)
- Use the title or a descriptive text as the link text
- Keep everything in markdown format

## Response Guidelines:
- Fetch real data before calculations
- Show your calculation expressions for transparency
- Round results appropriately (2 decimals for percentages, 0 for currency)
- For charts: use the chart URL from the tool result to craft a descriptive markdown link in-line
- Provide clear explanations
- Always clarify this is informational, not financial advice
- Recommend consulting a SEBI-registered advisor for decisions
  `,
  tools: [
    searchMutualFunds,
    getMutualFundDetails,
    getNavHistory,
    calculateExpression, // Single powerful math tool!
    generateChart,
    compareMutualFunds,
  ],
  inputGuardrails: [inputGuardrail],
});

// Main function to run the agent
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
  console.log("  • Search for SBI Blue Chip fund");
  console.log("  • What's the CAGR of scheme 119551 over 3 years?");
  console.log("  • Calculate SIP of ₹5000 for 10 years at 12% return");
  console.log("  • Compare HDFC and ICICI large cap funds");
  console.log("  • Show NAV chart for Axis Bluechip");
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
        const result = await run(agent, userQuery);
        console.log("Agent:", result.finalOutput);
        console.log("\n" + "─".repeat(50) + "\n");
      } catch (error) {
        console.error("Error:", error.message);
      }

      askQuestion();
    });
  };

  askQuestion();
}

export { agent, main };

main().catch(console.error);
