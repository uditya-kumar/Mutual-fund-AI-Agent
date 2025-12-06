<div align="center">

# 🏦 Mutual Fund AI Agent

### AI-Powered Mutual Fund Analysis for Indian Markets

[![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.22.1-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Google Gemini](https://img.shields.io/badge/AI-Google%20Gemini%202.5-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)
[![License](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)

[Features](#-features) • [Quick Start](#-quick-start) • [Usage](#-usage) • [Architecture](#-architecture) • [Contributing](#-contributing)

</div>

---

## 📖 Overview

An intelligent chat-based platform for analyzing 223,000+ Indian mutual funds using Google Gemini AI. Get real-time insights, performance calculations, and interactive visualizations through natural language queries.

**Key Features**: Instant search • CAGR calculations • SIP projections • Interactive charts • Smart AI responses

---

## ✨ Features

- **🔍 Smart Search**: Type `@` for instant autocomplete across 223K+ funds
- **📊 Analytics**: CAGR, returns, SIP calculations, volatility metrics
- **📈 Charts**: Interactive ApexCharts visualizations (line, bar, pie)
- **🤖 AI Powered**: Natural language queries via Google Gemini 2.5 Flash
- **⚡ Fast**: Local database search with <100ms response time
- **🎨 Modern UI**: Clean dark/light theme with real-time status updates

---

## 🚀 Quick Start

### Installation

```bash
# Clone repository
git clone https://github.com/uditya2004/Mutual-fund-AI-Agent.git
cd Mutual-fund-AI-Agent

# Install dependencies
npm install

# Create .env file
echo "GOOGLE_GENERATIVE_AI_API_KEY=your_api_key" > .env

# Start web interface
npm run server
# Open http://localhost:3000

# Or use terminal interface
npm run dev
```

**Requirements**: Node.js v18+, Google Gemini API key from [ai.google.dev](https://ai.google.dev/)

---

## 💡 Usage

### Search & Query

```
@SBI Blue Chip                           # Search with autocomplete
What's the NAV of scheme 119551?         # Get current NAV
Calculate 5-year CAGR for @HDFC Top 100  # Performance analysis
SIP of ₹10,000 for 20 years at 12%       # Investment planning
Compare @Axis Bluechip and @ICICI Pru    # Fund comparison
Show NAV chart for @Parag Parikh Flexi   # Visualizations
```

### Status Indicators

| Icon | Meaning |
|------|---------|
| 🤔 | AI thinking |
| 🔨 | Executing tool |
| 📊 | Generating chart |

---

## 🏗 Architecture

```
User → Express Server → AI Agent → Tools → Response
           ↓               ↓
       Autocomplete    (6 Tools: Search, NAV, 
                        Calculate, Chart, Compare)
           ↓               ↓
    mutualFund.js     MFAPI.in
    (223K funds)      (Live data)
```

### Tech Stack

**Backend**: Express.js, OpenAI Agents SDK  
**Frontend**: Vanilla JS, ApexCharts  
**AI**: Google Gemini 2.5 Flash  
**Math**: mathjs  
**Data**: Local JSON + MFAPI.in

---

## 🛠 Core Tools

1. **search_mutual_funds** - Local keyword search (instant)
2. **get_mutual_fund_details** - Current NAV & metadata
3. **get_nav_history** - Historical NAV data
4. **calculate** - Math expressions (CAGR, SIP, statistics)
5. **generate_chart** - Interactive visualizations
6. **compare_mutual_funds** - Multi-fund analysis

---

## 📁 Project Structure

```
├── agent.js          # AI agent + tool definitions
├── server.js         # Express API server
├── index.html        # Chat interface
├── mutualFund.js     # 223K+ schemes database
└── package.json      # Dependencies
```

---

## 📊 Example Queries

**Search**: `@SBI Blue Chip` or `Search for HDFC equity funds`  
**Analysis**: `Calculate 5-year CAGR for scheme 119551`  
**Planning**: `SIP of ₹10,000 monthly for 20 years at 12% return`  
**Comparison**: `Compare @HDFC Top 100 and @Axis Bluechip`  
**Charts**: `Show NAV trend for @Parag Parikh Flexi Cap Fund`

---

## 🤝 Contributing

Contributions welcome! Fork the repo, create a feature branch, and submit a PR.

```bash
git checkout -b feature/your-feature
git commit -m 'Add feature'
git push origin feature/your-feature
```

---

## 📄 License & Author

**License**: ISC  
**Author**: Uditya ([@uditya2004](https://github.com/uditya2004))  
**Repository**: [Mutual-fund-AI-Agent](https://github.com/uditya2004/Mutual-fund-AI-Agent)

---

## ⚠️ Disclaimer

This tool is for **educational purposes only**. Not financial advice. Consult a SEBI-registered advisor before investing. Mutual funds are subject to market risks.

---

<div align="center">

**Made with ❤️ for Indian Investors**

⭐ Star this repo if you find it helpful!

[Report Bug](https://github.com/uditya2004/Mutual-fund-AI-Agent/issues) • [Request Feature](https://github.com/uditya2004/Mutual-fund-AI-Agent/issues)

</div>
