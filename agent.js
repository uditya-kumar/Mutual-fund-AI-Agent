import { Agent, run } from "@openai/agents";
import { tool } from "@openai/agents";
import { z } from "zod";
import { create, all } from "mathjs";
import "dotenv/config";
import axios from "axios";

// Base URL for the hosted API
const API_BASE_URL = "https://upstocks-api.onrender.com";

// Initialize mathjs with all functions
const math = create(all);

// Create a Gemini model instance using the AI SDK adapter
// const model = aisdk(google("gemini-2.5-flash"));

// const groqClient = new OpenAI({
//   baseURL: "https://api.groq.com/openai/v1",
//   apiKey: process.env.GROQ_API_KEY,
// });

// // Set Groq as the default OpenAI client
// setDefaultOpenAIClient(groqClient);

// // Define the model to use
// const model = "openai/gpt-oss-120b";

// Input Guardrail Agent - Checks if query is related to mutual funds/investing
const inputGuardAgent = new Agent({
  name: "Mutual Fund Query Validator",
  // model: model,
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

// Helper function to convert name to slug format
function nameToSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')          // Replace spaces with hyphens
    .replace(/-+/g, '-')           // Replace multiple hyphens with single
    .replace(/^-|-$/g, '');        // Remove leading/trailing hyphens
}

// Helper function to build fund slug from schemeName and schemeCode
function buildFundSlugFromSearch(schemeName, schemeCode) {
  if (!schemeName || !schemeCode) return null;
  const slug = nameToSlug(schemeName);
  return `${slug}-${schemeCode}`;
}

// Tool: Search for mutual funds using hosted API
const searchMutualFunds = tool({
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
      const response = await axios.get(`${API_BASE_URL}/api/mutual-fund/search`, {
        params: { query }
      });
      const data = response.data;
      
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

// Tool: Get mutual fund details using hosted API
const getMutualFundDetails = tool({
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
      
      const response = await axios.get(`${API_BASE_URL}/api/mutual-fund`, {
        params: { fund: cleanSlug }
      });
      const data = response.data;
      
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

// Tool: Get NAV history using hosted API
const getNavHistory = tool({
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
      const response = await axios.get(`${API_BASE_URL}/api/mutual-fund/${fundId}/nav-history`, {
        params: {
          navPeriod,
          interval,
          investedAmount,
        }
      });
      return JSON.stringify(response.data);
    } catch (error) {
      return JSON.stringify({ error: error.message });
    }
  },
});

// Tool: Get category returns comparison using hosted API
const getCategoryReturns = tool({
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

// Tool: Calculate mathematical expressions
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

Include all values directly in the expression string. For example: '((94.14 / 86.99) ^ (1/1) - 1) * 100' for CAGR calculation.`,
  parameters: z.object({
    expression: z
      .string()
      .describe("Mathematical expression to evaluate with all values included directly"),
  }),
  async execute({ expression }) {
    console.log("🔨 Calling Calculate Expression tool");
    try {
      const result = math.evaluate(expression);

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
      .describe("Type of chart: line, bar, pie, doughnut, radar"),
    title: z.string().describe("Chart title"),
    labels: z
      .array(z.string())
      .describe("Labels for the data points"),
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
            title: { display: true, text: title, font: { size: 16 }, color: "#e8e8e8" },
            legend: { display: true, position: "bottom", labels: { color: "#e8e8e8" } },
          },
          scales:
            chartType === "line" || chartType === "bar"
              ? {
                  y: { beginAtZero: false, ticks: { color: "#888" }, grid: { color: "#2a2a2a" } },
                  x: { ticks: { color: "#888" }, grid: { color: "#2a2a2a" } },
                }
              : undefined,
        },
      };

      const response = await fetch("https://quickchart.io/chart/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ backgroundColor: "black", width: 800, height: 400, chart: chartConfig }),
      });

      const result = await response.json();

      if (result.success && result.url) {
        return JSON.stringify({ type: "CHART", url: result.url, title: title });
      } else {
        const chartUrl = `https://quickchart.io/chart?backgroundColor=black&c=${encodeURIComponent(JSON.stringify(chartConfig))}&w=800&h=400`;
        return JSON.stringify({ type: "CHART", url: chartUrl, title: title });
      }
    } catch (error) {
      return JSON.stringify({ error: error.message });
    }
  },
});

// Tool: Compare multiple mutual funds using hosted API
const compareMutualFunds = tool({
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
          const response = await axios.get(`${API_BASE_URL}/api/mutual-fund/${fundId}/category-returns`, {
            params: { navPeriod: "5Y" }
          });
          const data = response.data;
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

// Create the Financial AI Agent
const agent = new Agent({
  name: "Mutual Fund Advisor",
  // model: model,
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

// Only run CLI when executed directly (not when imported)
const isMainModule = import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`;
if (isMainModule) {
  main().catch(console.error);
}
