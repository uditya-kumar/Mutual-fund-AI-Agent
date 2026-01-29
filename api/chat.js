import { Agent, run } from "@openai/agents";
import { tool } from "@openai/agents";
import { z } from "zod";
import { create, all } from "mathjs";
import axios from "axios";

// Base URL for the hosted API
const API_BASE_URL = "https://upstocks-api.onrender.com";

// Initialize mathjs with all functions
const math = create(all);

// Helper function to convert name to slug format
function nameToSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// Helper function to build fund slug from schemeName and schemeCode
function buildFundSlugFromSearch(schemeName, schemeCode) {
  if (!schemeName || !schemeCode) return null;
  const slug = nameToSlug(schemeName);
  return `${slug}-${schemeCode}`;
}

// Tool: Search for mutual funds
const searchMutualFunds = tool({
  name: "search_mutual_funds",
  description: "Search for mutual funds by name or keyword.",
  parameters: z.object({
    query: z.string().describe("The search term to find mutual funds"),
  }),
  async execute({ query }) {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/mutual-fund/search`, {
        params: { query, records: 15 }
      });
      const searchList = response.data?.data?.searchList || [];

      const mutualFunds = searchList
        .filter(item => item.type === 'MF' && item.attributes)
        .map(item => ({
          schemeCode: item.attributes.instrumentKey || item.attributes.upstoxSchemeId || '',
          schemeName: item.attributes.schemeName || item.attributes.tradingSymbol || '',
          category: item.attributes.category || '',
        }))
        .filter(fund => fund.schemeName && fund.schemeCode);

      if (mutualFunds.length === 0) {
        return JSON.stringify({ status: "not_found", message: `No mutual funds found matching "${query}".`, matchCount: 0 });
      }

      if (mutualFunds.length === 1) {
        const fund = mutualFunds[0];
        return JSON.stringify({
          status: "single_match",
          message: `Found exact match for "${query}"`,
          matchCount: 1,
          fund: { fundId: fund.schemeCode, fundName: fund.schemeName, fundSlug: buildFundSlugFromSearch(fund.schemeName, fund.schemeCode) },
        });
      }

      return JSON.stringify({
        status: "multiple_matches",
        message: `Found ${mutualFunds.length} mutual funds matching "${query}".`,
        matchCount: mutualFunds.length,
        funds: mutualFunds.slice(0, 15).map((fund, index) => ({
          index: index + 1,
          fundId: fund.schemeCode,
          fundName: fund.schemeName,
          category: fund.category,
          fundSlug: buildFundSlugFromSearch(fund.schemeName, fund.schemeCode),
        })),
      });
    } catch (error) {
      return JSON.stringify({ error: error.message });
    }
  },
});

// Tool: Get mutual fund details
const getMutualFundDetails = tool({
  name: "get_mutual_fund_details",
  description: "Get detailed information about a specific mutual fund using the fundSlug.",
  parameters: z.object({
    fundSlug: z.string().describe("The fund slug (e.g., 'parag-parikh-flexi-cap-direct-growth-100060')"),
  }),
  async execute({ fundSlug }) {
    try {
      const cleanSlug = fundSlug.trim().toLowerCase().replace(/\s+/g, '-');
      const response = await axios.get(`${API_BASE_URL}/api/mutual-fund`, { params: { fund: cleanSlug } });
      
      if (!response.data || Object.keys(response.data).length === 0) {
        return JSON.stringify({ error: "No data found for this fund", attemptedSlug: cleanSlug });
      }
      return JSON.stringify(response.data);
    } catch (error) {
      return JSON.stringify({ error: error.message, attemptedSlug: fundSlug });
    }
  },
});

// Tool: Get NAV history
const getNavHistory = tool({
  name: "get_nav_history",
  description: "Get NAV history for a mutual fund.",
  parameters: z.object({
    fundId: z.string().describe("The fund ID (e.g., '100060')"),
    navPeriod: z.string().default("5Y").describe("Period: '1M', '3M', '6M', '1Y', '3Y', '5Y'"),
    interval: z.number().default(1).describe("Interval in days: 1 for daily, 30 for monthly"),
    investedAmount: z.number().default(1000).describe("Investment amount"),
  }),
  async execute({ fundId, navPeriod, interval, investedAmount }) {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/mutual-fund/${fundId}/nav-history`, {
        params: { navPeriod, interval, investedAmount }
      });
      return JSON.stringify(response.data);
    } catch (error) {
      return JSON.stringify({ error: error.message });
    }
  },
});

// Tool: Get category returns
const getCategoryReturns = tool({
  name: "get_category_returns",
  description: "Get category returns comparison for a mutual fund.",
  parameters: z.object({
    fundId: z.string().describe("The fund ID"),
    navPeriod: z.string().default("5Y").describe("Period for comparison"),
    interval: z.number().default(30).describe("Interval in days"),
  }),
  async execute({ fundId, navPeriod, interval }) {
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

// Tool: Calculate expressions
const calculateExpression = tool({
  name: "calculate",
  description: "Evaluate mathematical expressions using mathjs.",
  parameters: z.object({
    expression: z.string().describe("Mathematical expression to evaluate"),
  }),
  async execute({ expression }) {
    try {
      const result = math.evaluate(expression);
      let formattedResult = typeof result === "number" ? math.round(result, 6) : result;
      return JSON.stringify({ expression, result: formattedResult });
    } catch (error) {
      return JSON.stringify({ error: error.message });
    }
  },
});

// Tool: Generate charts
const generateChart = tool({
  name: "generate_chart",
  description: "Generate visual charts using QuickChart.",
  parameters: z.object({
    chartType: z.string().describe("Type: line, bar, pie, doughnut"),
    title: z.string().describe("Chart title"),
    labels: z.array(z.string()).describe("Labels for data points"),
    datasets: z.array(z.object({
      label: z.string(),
      data: z.array(z.number()),
    })).describe("Datasets to plot"),
  }),
  async execute({ chartType, title, labels, datasets }) {
    try {
      const chartConfig = {
        type: chartType,
        data: {
          labels,
          datasets: datasets.map((ds, i) => ({
            label: ds.label,
            data: ds.data,
            borderColor: `hsl(${i * 60}, 70%, 50%)`,
            backgroundColor: `hsla(${i * 60}, 70%, 50%, 0.2)`,
            fill: chartType === "line",
            tension: 0.4,
          })),
        },
        options: {
          responsive: true,
          plugins: {
            title: { display: true, text: title, color: "#e8e8e8" },
            legend: { display: true, position: "bottom", labels: { color: "#e8e8e8" } },
          },
          scales: chartType === "line" || chartType === "bar" ? {
            y: { ticks: { color: "#888" }, grid: { color: "#2a2a2a" } },
            x: { ticks: { color: "#888" }, grid: { color: "#2a2a2a" } },
          } : undefined,
        },
      };

      const response = await fetch("https://quickchart.io/chart/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ backgroundColor: "black", width: 800, height: 400, chart: chartConfig }),
      });
      const result = await response.json();

      if (result.success && result.url) {
        return JSON.stringify({ type: "CHART", url: result.url, title });
      }
      return JSON.stringify({ type: "CHART", url: `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartConfig))}`, title });
    } catch (error) {
      return JSON.stringify({ error: error.message });
    }
  },
});

// Tool: Compare funds
const compareMutualFunds = tool({
  name: "compare_mutual_funds",
  description: "Compare multiple mutual funds.",
  parameters: z.object({
    fundIds: z.array(z.string()).describe("Array of fund IDs to compare"),
  }),
  async execute({ fundIds }) {
    try {
      const comparisons = [];
      for (const fundId of fundIds) {
        try {
          const response = await axios.get(`${API_BASE_URL}/api/mutual-fund/${fundId}/category-returns`, {
            params: { navPeriod: "5Y" }
          });
          comparisons.push({
            fundId,
            fundName: response.data.data?.fundName || `Fund ${fundId}`,
            category: response.data.data?.category,
            returns: response.data.data?.returns,
            data: response.data.data,
          });
        } catch (err) {
          comparisons.push({ fundId, error: err.message });
        }
      }
      return JSON.stringify(comparisons);
    } catch (error) {
      return JSON.stringify({ error: error.message });
    }
  },
});

// Create the agent
const agent = new Agent({
  name: "Mutual Fund Advisor",
  instructions: `You are an expert mutual fund advisor for Indian mutual funds.

## Capabilities:
1. Search funds with search_mutual_funds
2. Get details with get_mutual_fund_details (use fundSlug)
3. Get NAV history with get_nav_history (use fundId)
4. Get category returns with get_category_returns (use fundId)
5. Calculate with calculate tool
6. Generate charts with generate_chart
7. Compare funds with compare_mutual_funds

## Important:
- First search for a fund, then use the fundSlug for details
- Use fundId (numeric) for NAV history and category returns
- Show calculations for transparency
- This is informational, not financial advice`,
  tools: [
    searchMutualFunds,
    getMutualFundDetails,
    getNavHistory,
    getCategoryReturns,
    calculateExpression,
    generateChart,
    compareMutualFunds,
  ],
});

export default async function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  // Set up SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    // Send thinking status
    res.write(`data: ${JSON.stringify({ type: 'status', status: 'thinking' })}\n\n`);

    const result = await run(agent, message, {
      onToolStart: (tool) => {
        res.write(`data: ${JSON.stringify({ type: 'status', status: 'tool_call', tool: tool.name })}\n\n`);
      },
    });

    const output = result.finalOutput;

    // Check if output contains chart data
    if (output && output.includes('"type":"CHART"')) {
      try {
        const chartMatch = output.match(/\{"type":"CHART"[^}]+\}/);
        if (chartMatch) {
          const chartData = JSON.parse(chartMatch[0]);
          res.write(`data: ${JSON.stringify({ type: 'chart', url: chartData.url })}\n\n`);
        }
      } catch (e) {
        // Not a chart, send as message
      }
    }

    res.write(`data: ${JSON.stringify({ type: 'message', content: output })}\n\n`);
    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
  } catch (error) {
    console.error('Agent error:', error);
    res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
  } finally {
    res.end();
  }
}
