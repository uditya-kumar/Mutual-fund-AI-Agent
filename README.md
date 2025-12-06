<div align="center">

# 🏦 Mutual Fund AI Agent

### AI-Powered Mutual Fund Analysis Platform for Indian Markets

[![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.22.1-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Google Gemini](https://img.shields.io/badge/AI-Google%20Gemini%202.5%20Flash-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)
[![License](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)

[Features](#-features) • [Quick Start](#-quick-start) • [Usage](#-usage) • [Architecture](#-architecture) • [API Reference](#-api-reference) • [Contributing](#-contributing)

<img src="https://img.shields.io/badge/Mutual_Funds-223K+-green?style=for-the-badge" alt="Funds Database"/>
<img src="https://img.shields.io/badge/Response_Time-<100ms-success?style=for-the-badge" alt="Response Time"/>

</div>

---

## 📖 Overview

**Mutual Fund AI Agent** is an intelligent financial assistant that provides comprehensive analysis of Indian mutual funds through an intuitive chat interface. Leveraging Google's Gemini 2.5 Flash AI model and the OpenAI Agents SDK, it offers real-time insights, historical data analysis, performance calculations, and interactive visualizations—all within a modern, WhatsApp-like interface.

### 🎯 Key Highlights

- **223,000+ Mutual Funds**: Complete database of Indian mutual fund schemes
- **Intelligent Search**: Instant autocomplete with @ mention support
- **Real-time Analysis**: Live NAV data, CAGR calculations, SIP projections
- **Interactive Charts**: Client-side rendering with ApexCharts
- **AI-Powered Insights**: Natural language queries processed by Gemini 2.5 Flash
- **Smart Guardrails**: Built-in validation to ensure finance-focused conversations
- **Dual Interfaces**: Web-based chat UI and terminal interface

---

## ✨ Features

### 🔍 Smart Search & Discovery
- **Instant Autocomplete**: Type `@` to search 223K+ funds with real-time suggestions
- **Fuzzy Matching**: Intelligent keyword matching for fund names
- **Local Database**: Zero latency search using in-memory JSON data

### 📊 Advanced Analytics
- **NAV Tracking**: Current and historical Net Asset Value data
- **Performance Metrics**: CAGR, absolute returns, volatility calculations
- **SIP Calculator**: Future value projections and required investment calculations
- **Comparative Analysis**: Side-by-side fund performance comparison

### 📈 Data Visualization
- **Interactive Charts**: ApexCharts-powered visualizations
- **Multiple Chart Types**: Line, bar, pie, doughnut, and radar charts
- **Historical Trends**: NAV trends over customizable time periods
- **Performance Comparison**: Visual comparison of multiple funds

### 🤖 AI Capabilities
- **Natural Language Processing**: Ask questions in plain English/Hindi
- **Tool Orchestration**: Automatic selection of appropriate tools and APIs
- **Contextual Responses**: AI understands investment context and terminology
- **Input Validation**: Guardrails prevent off-topic queries

### 🎨 User Experience
- **Modern UI**: Clean, minimalist design with dark/light mode
- **Real-time Feedback**: Status indicators for AI thinking and tool execution
- **Responsive Design**: Optimized for desktop and mobile browsers
- **Accessibility**: Keyboard navigation and screen reader support

---

## 🚀 Quick Start

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v8.0.0 or higher
- **Google Gemini API Key**: Get it from [Google AI Studio](https://ai.google.dev/)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/uditya2004/Mutual-fund-AI-Agent.git
   cd Mutual-fund-AI-Agent
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here
   ```

4. **Start the application**
   
   **Web Interface (Recommended)**:
   ```bash
   npm run server
   ```
   Navigate to `http://localhost:3000`

   **Terminal Interface**:
   ```bash
   npm run dev
   ```

---

## 💡 Usage

### Web Interface

#### 1. **Search for Mutual Funds**

Type `@` followed by fund keywords to trigger autocomplete:

```
@SBI Blue Chip
@HDFC Top 100
@Axis Small Cap Fund
```

Use arrow keys (↑/↓) to navigate suggestions and press Enter to select.

#### 2. **Query Examples**

**Basic Information:**
```
What's the current NAV of SBI Blue Chip Fund?
Show details for scheme code 119551
```

**Performance Analysis:**
```
Calculate 5-year CAGR for @Parag Parikh Flexi Cap Fund
Compare returns of @HDFC Top 100 and @ICICI Bluechip
What's the volatility of scheme 122639?
```

**Investment Planning:**
```
Calculate SIP of ₹10,000 for 15 years at 12% returns
How much to invest monthly to reach ₹1 crore in 20 years?
Show returns for lump sum investment of ₹5 lakhs over 10 years
```

**Visualizations:**
```
Show NAV trend chart for @Axis Bluechip Fund
Compare performance charts of 3 large cap funds
Plot 1-year NAV history for scheme 119551
```

#### 3. **Status Indicators**

| Icon | Status | Description |
|------|--------|-------------|
| 🤔 | Thinking... | AI is processing your query |
| 🔨 | Calling [Tool] | Executing specific tool (search, fetch, calculate) |
| 📊 | Creating chart... | Generating visualization |
| ✅ | Complete | Response ready |

### Terminal Interface

Launch with `npm run dev` and interact via command-line:

```
You: Search for SBI large cap funds
Agent: [Displays matching funds with scheme codes]

You: Calculate CAGR for scheme 119551 over 3 years
Agent: [Fetches data and shows calculation steps]
```

Type `exit` to quit.

---

## 🏗 Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Interface                          │
│  ┌────────────────────┐              ┌────────────────────┐    │
│  │   Web Browser      │              │   Terminal CLI     │    │
│  │  (index.html)      │              │   (agent.js)       │    │
│  └──────────┬─────────┘              └──────────┬─────────┘    │
└─────────────┼────────────────────────────────────┼──────────────┘
              │                                    │
              ▼                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Express Server (server.js)                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Routes:                                                  │  │
│  │  • GET  /api/search-funds  (Autocomplete)                │  │
│  │  • POST /api/chat          (Chat with AI)                │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────┬───────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   AI Agent Layer (agent.js)                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  OpenAI Agents SDK + Google Gemini 2.5 Flash             │  │
│  │  • Input Guardrails (Query Validation)                   │  │
│  │  • Tool Selection & Orchestration                        │  │
│  │  • Response Generation                                   │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────┬───────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────┐
│                          Tool Layer                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐│
│  │ search_mutual   │  │ get_mutual_fund │  │ get_nav_history ││
│  │ _funds          │  │ _details        │  │                 ││
│  │ (mutualFund.js) │  │ (API fetch)     │  │ (API fetch)     ││
│  └─────────────────┘  └─────────────────┘  └─────────────────┘│
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐│
│  │ calculate       │  │ generate_chart  │  │ compare_mutual  ││
│  │ (mathjs)        │  │ (ApexCharts)    │  │ _funds          ││
│  └─────────────────┘  └─────────────────┘  └─────────────────┘│
└─────────────┬───────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Data Sources                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  • mutualFund.js (223K+ schemes, local JSON)             │  │
│  │  • MFAPI.in (Real-time NAV data)                         │  │
│  │  • QuickChart.io (Chart generation fallback)             │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Component Breakdown

#### **Frontend (index.html)**
- **Pure Vanilla JavaScript**: No framework dependencies
- **ApexCharts Integration**: Client-side chart rendering
- **SSE (Server-Sent Events)**: Real-time status updates
- **Autocomplete System**: Debounced search with keyboard navigation
- **Theme Support**: Dark/light mode with CSS variables

#### **Backend (server.js)**
- **Express.js Server**: RESTful API endpoints
- **Streaming Responses**: SSE for real-time agent feedback
- **Error Handling**: Guardrail violations and API errors
- **Static File Serving**: Frontend assets

#### **AI Agent (agent.js)**
- **OpenAI Agents SDK**: Tool orchestration and workflow management
- **Google Gemini 2.5 Flash**: LLM for natural language understanding
- **Input Guardrails**: Finance-focused query validation
- **Tool Definitions**: Zod schema validation for tool parameters

#### **Data Layer (mutualFund.js)**
- **In-Memory Database**: 223,000+ scheme records
- **Instant Search**: O(n) linear search with filter
- **ISIN Codes**: Growth and dividend reinvestment identifiers

---

## 🛠 API Reference

### Tools Available to AI Agent

#### 1. `search_mutual_funds`
**Description**: Search local database for mutual funds by name or keyword

**Parameters**:
```typescript
{
  query: string // Search term (e.g., "SBI Blue Chip")
}
```

**Returns**:
```json
{
  "status": "single_match" | "multiple_matches" | "not_found",
  "matchCount": number,
  "funds": [
    {
      "schemeCode": number,
      "schemeName": string
    }
  ]
}
```

#### 2. `get_mutual_fund_details`
**Description**: Fetch current NAV and recent history for a specific scheme

**Parameters**:
```typescript
{
  schemeCode: string // Scheme code from search results
}
```

**Returns**:
```json
{
  "meta": {
    "scheme_name": string,
    "scheme_category": string,
    "scheme_type": string
  },
  "currentNav": {
    "date": string,
    "nav": string
  },
  "recentNavHistory": Array<{date: string, nav: string}>
}
```

#### 3. `get_nav_history`
**Description**: Retrieve historical NAV data for specified period

**Parameters**:
```typescript
{
  schemeCode: string,
  limit?: number // Default: 365 days
}
```

#### 4. `calculate`
**Description**: Evaluate mathematical expressions using mathjs

**Parameters**:
```typescript
{
  expression: string, // e.g., "((150/100)^(1/5) - 1) * 100"
  variables?: Record<string, number | number[]>
}
```

**Supported Operations**:
- Basic: `+`, `-`, `*`, `/`, `^`, `sqrt()`, `abs()`, `round()`
- Statistics: `mean()`, `median()`, `std()`, `min()`, `max()`, `sum()`
- Financial formulas: CAGR, SIP future value, required SIP

#### 5. `generate_chart`
**Description**: Create interactive charts with ApexCharts

**Parameters**:
```typescript
{
  chartType: "line" | "bar" | "pie" | "doughnut" | "radar",
  title: string,
  labels: string[],
  datasets: Array<{
    label: string,
    data: number[]
  }>
}
```

#### 6. `compare_mutual_funds`
**Description**: Compare performance metrics of multiple funds

**Parameters**:
```typescript
{
  schemeCodes: string[] // Array of scheme codes to compare
}
```

### REST API Endpoints

#### `GET /api/search-funds`
**Query Parameters**:
- `q` (string): Search query

**Response**:
```json
[
  {
    "schemeCode": 119551,
    "schemeName": "SBI Blue Chip Fund - Direct Plan - Growth"
  }
]
```

#### `POST /api/chat`
**Request Body**:
```json
{
  "message": "What's the CAGR of SBI Blue Chip over 5 years?"
}
```

**Response**: Server-Sent Events stream
```
data: {"type":"status","status":"thinking"}
data: {"type":"status","status":"tool_call","tool":"get_nav_history"}
data: {"type":"message","content":"The 5-year CAGR is 14.23%..."}
data: {"type":"done"}
```

---

## 📊 Technology Stack

| Category | Technology | Purpose |
|----------|-----------|---------|
| **AI/ML** | Google Gemini 2.5 Flash | Natural language understanding and generation |
| **Framework** | OpenAI Agents SDK | Tool orchestration and workflow management |
| **Backend** | Express.js | HTTP server and REST API |
| **Frontend** | Vanilla JavaScript | Client-side application logic |
| **Visualization** | ApexCharts | Interactive chart rendering |
| **Math Engine** | mathjs | Financial calculations and statistics |
| **Validation** | Zod | Schema validation for tool parameters |
| **Data Source** | MFAPI.in | Real-time mutual fund NAV data |
| **Runtime** | Node.js | JavaScript execution environment |

---

## 📁 Project Structure

```
financial-ai-agent/
├── agent.js                 # AI agent configuration and tool definitions
├── server.js                # Express server with API endpoints
├── index.html               # Web interface (chat UI)
├── mutualFund.js            # Local database (223K+ schemes)
├── package.json             # Project dependencies and scripts
├── .env                     # Environment variables (not in repo)
├── .gitignore              # Git ignore rules
└── README.md               # This file
```

---

## 🎓 Example Use Cases

### 1. **Research Phase**
```
User: Search for top large cap equity funds
Agent: [Lists top large cap funds with scheme codes]

User: Show details for @SBI Blue Chip Fund
Agent: [Displays scheme info, current NAV, category]
```

### 2. **Performance Analysis**
```
User: Calculate 3-year CAGR for scheme 119551
Agent: 
  Initial NAV (Jan 2022): ₹65.43
  Current NAV (Jan 2025): ₹98.76
  CAGR: 14.85%
  
  Formula used: ((98.76/65.43)^(1/3) - 1) * 100
```

### 3. **Investment Planning**
```
User: I want to invest ₹10,000 monthly for 20 years. 
      Assuming 12% annual return, what will be the corpus?
Agent:
  Monthly Investment: ₹10,000
  Duration: 20 years (240 months)
  Expected Return: 12% annually
  
  Future Value: ₹99,91,473
  Total Investment: ₹24,00,000
  Wealth Gained: ₹75,91,473
```

### 4. **Comparative Analysis**
```
User: Compare @HDFC Top 100 and @Axis Bluechip Fund
Agent:
  [Displays side-by-side comparison table]
  
  Fund A: HDFC Top 100 Fund
  - Current NAV: ₹852.34
  - 1Y Return: 18.45%
  - 3Y CAGR: 15.23%
  
  Fund B: Axis Bluechip Fund
  - Current NAV: ₹456.78
  - 1Y Return: 19.12%
  - 3Y CAGR: 16.01%
  
  [Interactive comparison chart]
```

---

## 🔒 Security & Privacy

- **API Key Protection**: Environment variables prevent key exposure
- **Input Validation**: Guardrails block malicious or off-topic queries
- **No Data Storage**: Chat history is session-based only
- **HTTPS Recommended**: Use reverse proxy for production deployment
- **Rate Limiting**: Implement rate limiting for production use

---

## 🚧 Roadmap

- [ ] **User Authentication**: Multi-user support with saved portfolios
- [ ] **Portfolio Tracking**: Track personal investments and gains
- [ ] **Alerts & Notifications**: Price alerts and performance notifications
- [ ] **Advanced Analytics**: Sharpe ratio, alpha, beta calculations
- [ ] **Export Functionality**: PDF reports and CSV data export
- [ ] **Mobile App**: Native iOS/Android applications
- [ ] **Multi-language Support**: Hindi and other Indian languages
- [ ] **Integration with Brokers**: Direct investment capabilities

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines

- Follow existing code style and conventions
- Add comments for complex logic
- Test thoroughly before submitting PR
- Update README for new features

---

## 📄 License

This project is licensed under the **ISC License**. See [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Uditya**

- GitHub: [@uditya2004](https://github.com/uditya2004)
- Repository: [Mutual-fund-AI-Agent](https://github.com/uditya2004/Mutual-fund-AI-Agent)

---

## 🙏 Acknowledgments

- **MFAPI.in**: Free mutual fund data API
- **Google Gemini**: Powerful AI language model
- **OpenAI**: Agents SDK for tool orchestration
- **ApexCharts**: Beautiful chart library
- **Indian Mutual Fund Industry**: Data providers

---

## 📞 Support

For questions, issues, or feature requests:

- **GitHub Issues**: [Create an issue](https://github.com/uditya2004/Mutual-fund-AI-Agent/issues)
- **Discussions**: [Join the discussion](https://github.com/uditya2004/Mutual-fund-AI-Agent/discussions)

---

## ⚠️ Disclaimer

**This tool is for informational and educational purposes only.** It does not constitute financial advice, investment recommendations, or an offer to buy or sell securities. Always consult with a SEBI-registered financial advisor before making investment decisions.

Past performance is not indicative of future results. Mutual fund investments are subject to market risks.

---

<div align="center">

**Made with ❤️ for Indian investors**

⭐ **Star this repo** if you find it helpful!

[Report Bug](https://github.com/uditya2004/Mutual-fund-AI-Agent/issues) • [Request Feature](https://github.com/uditya2004/Mutual-fund-AI-Agent/issues)

</div>
