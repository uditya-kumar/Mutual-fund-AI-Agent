import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { run, InputGuardrailTripwireTriggered } from '@openai/agents';
import config from './config.js';
import mutualFundRoutes from './routes/mutualFund.routes.js';
import { agent } from '../agent.js';
import { upstoxService } from './services/upstox.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = config.server.port;

// Middleware
app.use(express.json());

// Serve static files from root directory
app.use(express.static(path.join(__dirname, '..')));

// Serve index.html for root path
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Mutual Fund API Routes
app.use('/api/mutual-fund', mutualFundRoutes);

// Search funds endpoint for autocomplete (used by index.html)
app.get('/api/search-funds', async (req, res) => {
  try {
    const query = req.query.q?.toLowerCase().trim() || '';
    
    if (!query) {
      return res.json([]);
    }

    // Use upstoxService to search
    const data = await upstoxService.search({ query });
    
    // Get results from data.data.searchList
    const results = data?.data?.searchList || [];
    
    // Filter and format results for autocomplete
    // API returns { type: "SCRIP", attributes: { instrumentKey, name, tradingSymbol, segment, ... } }
    const mutualFunds = results
      .filter(item => item.attributes) // Ensure attributes exist
      .slice(0, 10)
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

    res.json(mutualFunds);
  } catch (error) {
    console.error('Search error:', error.message);
    res.json([]);
  }
});

// Chat endpoint for AI agent (SSE streaming)
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Set up SSE headers for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Send status updates
    const sendStatus = (status, data = {}) => {
      res.write(`data: ${JSON.stringify({ type: 'status', status, ...data })}\n\n`);
    };

    // Override console.log to capture tool calls
    const originalLog = console.log;
    console.log = (...args) => {
      const logMessage = args.join(' ');
      if (logMessage.includes('🔨')) {
        sendStatus('tool_call', { tool: logMessage.replace('🔨 ', '') });
      }
      originalLog(...args);
    };

    sendStatus('thinking');

    const result = await run(agent, message);

    // Restore console.log
    console.log = originalLog;

    // Send the message (markdown passes through as-is)
    const finalContent = result.finalOutput.trim();
    res.write(`data: ${JSON.stringify({ type: 'message', content: finalContent })}\n\n`);

    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();
  } catch (error) {
    console.error('Error:', error);
    
    // Check if it's a guardrail tripwire error
    if (error instanceof InputGuardrailTripwireTriggered) {
      const reason = error.result?.outputInfo?.reason || 'This query is not related to mutual funds or investing.';
      res.write(`data: ${JSON.stringify({ 
        type: 'message', 
        content: `🚫 **Query Rejected**\n\n${reason}\n\nI'm a mutual fund advisor and can only help with:\n- Searching and analyzing mutual funds\n- Calculating returns, SIP, and CAGR\n- Comparing funds and viewing charts\n- Investment-related questions\n\nPlease ask something related to mutual funds or investing!` 
      })}\n\n`);
      res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    } else {
      res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
    }
    res.end();
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'Server is running', 
    endpoints: [
      'GET  / - Website',
      'GET  /api/mutual-fund?fund=<slug> - Parsed fund data',
      'GET  /api/mutual-fund/raw?fund=<slug> - Raw HTML',
      'GET  /api/mutual-fund/:fundId/nav-history - NAV history',
      'GET  /api/mutual-fund/:fundId/category-returns - Category returns',
      'GET  /api/mutual-fund/search?query=<keyword> - Search funds',
      'GET  /api/search-funds?q=<query> - Autocomplete search',
      'POST /api/chat - Chat with AI agent (SSE)',
    ] 
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📊 Mutual Fund AI Chat Interface Ready!`);
  console.log(`\nAPI Endpoints:`);
  console.log(`  - Website: http://localhost:${PORT}/`);
  console.log(`  - Chat API: POST http://localhost:${PORT}/api/chat`);
  console.log(`  - Search: http://localhost:${PORT}/api/mutual-fund/search?query=parag`);
  console.log(`  - Fund Data: http://localhost:${PORT}/api/mutual-fund?fund=parag-parikh-flexi-cap-direct-growth-100060`);
  console.log(`  - Nav History Data: http://localhost:${PORT}/api/mutual-fund/parag-parikh-flexi-cap-direct-growth-100060/nav-history`);
});