<div align="center">

# Mutual Fund AI Agent

### AI-Powered Mutual Fund Analysis for Indian Markets

[![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.22.1-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![OpenAI Agents SDK](https://img.shields.io/badge/OpenAI-Agents%20SDK-412991?logo=openai&logoColor=white)](https://github.com/openai/openai-agents-js)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

[Features](#features) • [Quick Start](#quick-start) • [Usage](#usage) • [Architecture](#architecture) • [Contributing](#contributing)

</div>

---

## Overview

An intelligent chat-based platform for analyzing Indian mutual funds using the OpenAI Agents SDK. Get real-time insights, performance calculations, and interactive charts through natural language queries, powered by the Upstox API.

**Key Features**: Instant search • CAGR calculations • SIP projections • Interactive charts • Smart AI responses • Input guardrails

---

## Features

| Feature | Description |
|---------|-------------|
| **Smart Search** | Type `@` for instant autocomplete via Upstox API |
| **Analytics** | CAGR, returns, SIP calculations, category comparisons |
| **Interactive Charts** | Recharts visualizations (line, area, bar, pie) rendered in the browser |
| **AI Powered** | Natural language queries via OpenAI Agents SDK |
| **Input Guardrails** | Validates queries to ensure they're finance-related |
| **Real-time** | Server-Sent Events (SSE) for streaming status + response |
| **Modern UI** | React + TypeScript chat interface with light/dark themes |

---

## Quick Start

### Requirements

Node.js v18+ and an OpenAI API key from [platform.openai.com](https://platform.openai.com/).

### Installation

```bash
# Clone repository
git clone https://github.com/uditya2004/Mutual-fund-AI-Agent.git
cd Mutual-fund-AI-Agent

# Install backend dependencies
npm install

# Create .env with your OpenAI API key
echo "OPENAI_API_KEY=your_api_key" > .env
```

### Development

The frontend and backend are separate npm projects. During development, run **both**: the Vite dev server hosts the UI with hot reload and proxies `/api/*` calls to the Express backend.

```bash
# Terminal 1 — backend (Express, http://localhost:3000)
npm run server

# Terminal 2 — frontend (Vite, http://localhost:5173)
npm run dev
```

Open http://localhost:5173.

### Production build

```bash
# Build the React frontend into frontend/dist
npm run build

# Serve the built UI + API from Express
npm run server
# Open http://localhost:3000
```

The Express server serves `frontend/dist` when it exists, so `npm run build` must run before deploying.

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
Show NAV chart for @Parag Parikh Flexi   # Interactive chart
Get category returns for fund 100060     # Category comparison
```

---

## Architecture

```
Browser (React + Vite)
  │  /api/chat (SSE), /api/search-funds
  ▼
Express (api/server.js)
  ├─ api/routes/*.route.js        one file per route
  ▼
Agent (agent/agent.js)
  ├─ Input Guardrail              rejects non-finance queries
  └─ 7 tools (agent/tools/*.js)   Upstox API + mathjs + chart spec
```

### How it works

1. The React UI posts a message to `/api/chat` and reads an **SSE** stream of frames (`status`, `message`, `error`, `done`).
2. The backend runs the OpenAI agent. An **input guardrail** first validates the query is finance-related; off-topic queries trip a wire and are rejected.
3. The agent calls tools as needed and returns a single markdown reply.
4. **Charts are interactive, not images.** The `generate_chart` tool returns a JSON chart spec; the agent embeds it verbatim in a ` ```chart ` fenced code block. The frontend parses the message into markdown + chart segments and renders charts with **Recharts** (which re-theme on light/dark toggle).

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | Express.js, OpenAI Agents SDK, Axios |
| **Frontend** | React 18, TypeScript, Vite |
| **AI** | OpenAI Agents SDK with input guardrails |
| **Math** | mathjs |
| **Charts** | Recharts |
| **Markdown** | marked + DOMPurify |
| **Data** | [Upstox API](https://github.com/uditya2004/Upstocks-API) proxy (live data) |

---

## Core Tools

Each tool lives in its own file under `agent/tools/` and is registered in `agent/agent.js`.

| Tool | Description |
|------|-------------|
| `search_mutual_funds` | Search funds by name/keyword via Upstox API |
| `get_mutual_fund_details` | Current NAV, returns & fund metadata (by fund slug) |
| `get_nav_history` | Historical NAV data with configurable period/interval |
| `get_category_returns` | Fund performance vs category average |
| `calculate` | Math expressions (CAGR, SIP, statistics) via mathjs |
| `generate_chart` | Returns a Recharts chart spec (line/area/bar/pie) |
| `compare_mutual_funds` | Multi-fund performance comparison |

---

## Project Structure

```
agent/                    AI agent (OpenAI Agents SDK)
  agent.js                connects guardrail + agent + tools; exports runChat()
  config.js               shared API_BASE_URL
  tools/                  one file per tool
api/                      Express backend
  server.js               entry point: serves frontend + mounts routes
  routes/                 one file per route (chat, health, search-funds)
frontend/                 React + Vite + TypeScript
  src/
    App.tsx               chat state + SSE handling
    components/            Message, Chart, ChatInput, StatusMessage
    lib/                   api (SSE), markdown (parse + chart blocks), chartColors
    hooks/useTheme.ts      light/dark theme
vercel.json               deployment config (routes all traffic to api/server.js)
.env                      OPENAI_API_KEY
```

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/chat` | POST | Chat with the AI agent (SSE stream) |
| `/api/search-funds` | GET | Fund search autocomplete (Upstox proxy) |
| `/api/health` | GET | Health check |

---

## Input Guardrails

The agent validates every query before processing. Only finance-related topics are allowed:

| Category | Examples |
|----------|----------|
| **Mutual Funds** | Searching, analyzing, comparing, NAV, returns, SIP |
| **Investing & Finance** | Stocks, bonds, portfolio, returns, CAGR |
| **Financial Calculations** | SIP calculator, projections, compound interest |
| **Indian Markets** | NSE, BSE, SEBI regulations, Indian fund houses |

> Off-topic queries are politely rejected with an explanation.

---

## Contributing

Contributions welcome! Fork the repo, create a feature branch, and submit a PR.

```bash
git checkout -b feature/your-feature
git commit -m 'Add feature'
git push origin feature/your-feature
```

- **New tool:** add `agent/tools/<name>.js` and register it in `agent/agent.js`.
- **New route:** add `api/routes/<name>.route.js` and mount it in `api/server.js`.

---

## License & Author

| | |
|---|---|
| **License** | [MIT](LICENSE) |
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
