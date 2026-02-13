<div align="center">

# Mutual Fund AI Agent

### AI-Powered Mutual Fund Analysis for Indian Markets

[![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.22.1-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![OpenAI Agents SDK](https://img.shields.io/badge/OpenAI-Agents%20SDK-412991?logo=openai&logoColor=white)](https://github.com/openai/openai-agents-js)
[![License](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)

[Features](#features) • [Quick Start](#quick-start) • [Usage](#usage) • [Architecture](#architecture) • [Contributing](#contributing)

</div>

---

## Overview

An intelligent chat-based platform for analyzing Indian mutual funds using the OpenAI Agents SDK. Get real-time insights, performance calculations, and interactive visualizations through natural language queries powered by the Upstox API.

**Key Features**: Instant search • CAGR calculations • SIP projections • Interactive charts • Smart AI responses • Input guardrails

---

## Features

| Feature | Description |
|---------|-------------|
| **Smart Search** | Type `@` for instant autocomplete via Upstox API |
| **Analytics** | CAGR, returns, SIP calculations, category comparisons |
| **Charts** | Interactive QuickChart visualizations (line, bar, pie, doughnut, radar) |
| **AI Powered** | Natural language queries via OpenAI Agents SDK |
| **Input Guardrails** | Validates queries to ensure they're finance-related |
| **Real-time** | Server-Sent Events (SSE) for streaming responses |
| **Modern UI** | Clean dark theme with real-time status updates |

---

## Quick Start

### Installation

```bash
# Clone repository
git clone https://github.com/uditya2004/Mutual-fund-AI-Agent.git
cd Mutual-fund-AI-Agent

# Install dependencies
npm install

# Create .env file with your OpenAI API key
echo "OPENAI_API_KEY=your_api_key" > .env

# Start web interface
npm start
# Open http://localhost:3000

# Or use CLI interface
npm run cli
```

**Requirements**: Node.js v18+, OpenAI API key from [platform.openai.com](https://platform.openai.com/)

---

## Usage

### Search & Query

```
@SBI Blue Chip                           # Search with autocomplete
Search for Parag Parikh flexi cap fund   # Search by name
Get details for fund 100060              # Get fund information
Calculate 5-year CAGR for @HDFC Top 100  # Performance analysis
SIP of ₹10,000 for 20 years at 12%       # Investment planning
Compare fund 100060 and 119551           # Fund comparison
Show NAV chart for @Parag Parikh Flexi   # Visualizations
Get category returns for fund 100060     # Category comparison
```

### Status Indicators

| Status | Meaning |
|--------|---------|
| Thinking | AI processing query |
| Tool Call | Executing tool |
| Chart | Generating visualization |

---

## Architecture

```
User → Express Server (SSE) → AI Agent → Tools → Response
           ↓                      ↓
       /api/chat              Input Guardrail
       /api/search-funds      (Query Validation)
           ↓                      ↓
    Upstox API Proxy         7 Tools: Search, Details,
                             NAV History, Category Returns,
                             Calculate, Chart, Compare
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | Express.js, OpenAI Agents SDK, Axios |
| **Frontend** | Vanilla JS (`public/index.html`) |
| **AI** | OpenAI Agents SDK with Input Guardrails |
| **Math** | mathjs |
| **Charts** | QuickChart.io |
| **Data** | [Upstocks-API](https://github.com/uditya-kumar/Upstocks-API) (live data) |

---

## Core Tools

| # | Tool | Description |
|---|------|-------------|
| 1 | `search_mutual_funds` | Search funds by name/keyword via Upstox API |
| 2 | `get_mutual_fund_details` | Get current NAV, returns & fund metadata |
| 3 | `get_nav_history` | Historical NAV data with configurable intervals |
| 4 | `get_category_returns` | Compare fund performance vs category average |
| 5 | `calculate` | Math expressions (CAGR, SIP, statistics) via mathjs |
| 6 | `generate_chart` | Interactive visualizations via QuickChart.io |
| 7 | `compare_mutual_funds` | Multi-fund performance comparison |

---

## Project Structure

| File/Folder | Description |
|-------------|-------------|
| `agent.js` | AI agent + tool definitions + guardrails |
| `server.js` | Express API server with SSE |
| `public/index.html` | Chat interface |
| `package.json` | Dependencies |
| `vercel.json` | Vercel deployment config |
| `.env` | Environment variables (`OPENAI_API_KEY`) |

---

## Example Queries

| Type | Example Query |
|------|---------------|
| **Search** | `@SBI Blue Chip` or `Search for HDFC equity funds` |
| **Details** | `Get details for parag-parikh-flexi-cap-direct-growth-100060` |
| **NAV History** | `Get NAV history for fund 100060 for 1 year with monthly interval` |
| **Analysis** | `Calculate CAGR: ((94.14 / 86.99) ^ (1/1) - 1) * 100` |
| **Planning** | `SIP of ₹10,000 monthly for 20 years at 12% return` |
| **Comparison** | `Compare fund 100060 and 119551` |
| **Charts** | `Show NAV trend for fund 100060` |

---

## Input Guardrails

The agent includes an input guardrail that validates queries. Only finance-related topics are allowed:

| Category | Examples |
|----------|----------|
| **Mutual Funds** | Searching, analyzing, comparing, NAV, returns, SIP |
| **Investing & Finance** | Stocks, bonds, portfolio, returns, CAGR |
| **Financial Calculations** | SIP calculator, projections, compound interest |
| **Indian Markets** | NSE, BSE, SEBI regulations, Indian fund houses |

> **Note:** Off-topic queries are politely rejected with an explanation.

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Serve chat interface |
| `/api/chat` | POST | Chat with AI agent (SSE) |
| `/api/search-funds` | GET | Search funds autocomplete |
| `/api/health` | GET | Health check |

---

## Contributing

Contributions welcome! Fork the repo, create a feature branch, and submit a PR.

```bash
git checkout -b feature/your-feature
git commit -m 'Add feature'
git push origin feature/your-feature
```

---

## License & Author

| | |
|---|---|
| **License** | ISC |
| **Author** | Uditya ([@uditya2004](https://github.com/uditya2004)) |
| **Repository** | [Mutual-fund-AI-Agent](https://github.com/uditya2004/Mutual-fund-AI-Agent) |

---

## Disclaimer

This tool is for **educational purposes only**. Not financial advice. Consult a SEBI-registered advisor before investing. Mutual funds are subject to market risks.

---

<div align="center">

**Made with ❤️ for Indian Investors**

⭐ Star this repo if you find it helpful!

</div>
