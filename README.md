# 🏦 Mutual Fund AI Agent - Chat Interface

A WhatsApp-like chat interface for analyzing Indian mutual funds using AI.

## Features

✅ **Smart Search** - Type `@` to search 223K+ mutual funds instantly
✅ **Real-time Status** - See "Thinking...", tool calls, and chart generation
✅ **Local Charts** - ApexCharts renders beautiful charts client-side
✅ **Fast Performance** - Local fund search, no unnecessary API calls
✅ **Clean UI** - Minimalist dark theme, no shadows

## Setup

1. **Install dependencies** (if not already done):
```bash
npm install
```

2. **Add your API key** to `.env`:
```
GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here
```

## Running the Application

### Option 1: Web Interface (Recommended)

```bash
npm run server
```

Then open your browser to: **http://localhost:3000**

### Option 2: Terminal Interface

```bash
npm run dev
```

## How to Use the Chat Interface

### 1. **Search for Funds**
Type `@` followed by keywords:
```
@SBI Blue Chip
@HDFC
@Axis Small Cap
```
Use ↑/↓ arrows to navigate, Enter to select.

### 2. **Ask Questions**
```
What's the NAV of SBI Blue Chip Fund (119551)?
Calculate CAGR for scheme 122639 over 3 years
Compare @HDFC Top 100 and @SBI Blue Chip
```

### 3. **Visual Feedback**
- 🤔 **Thinking...** - Agent is processing
- 🔨 **Calling [Tool]** - Specific tool being used
- 📊 **Creating chart...** - Chart is being generated

### 4. **Get Charts**
```
Show NAV chart for @Parag Parikh Flexi Cap
Compare returns of 3 large cap funds
```
Charts render locally using ApexCharts!

## Architecture

```
User Input → Server (Express) → Agent SDK → Tools → Response
                ↓                              ↓
            Autocomplete              Local mutualFund.js
            (instant)                  (223K schemes)
```

### Tools Available:
1. `search_mutual_funds` - Local search (instant)
2. `get_mutual_fund_details` - Fetch NAV data
3. `get_nav_history` - Historical data
4. `calculate` - Any math expression (mathjs)
5. `generate_chart` - ApexCharts config
6. `compare_mutual_funds` - Multi-fund analysis

## Benefits Over Previous Version

| Feature | Before | Now |
|---------|--------|-----|
| Search | API call (slow) | Local JSON (instant) |
| Charts | QuickChart URL | ApexCharts (interactive) |
| UX | Terminal only | Beautiful web UI |
| Feedback | None | Real-time status |
| Fund selection | Manual typing | @ autocomplete |

## Example Queries

```
1. Search for SBI mutual funds
2. What's the CAGR of @SBI Blue Chip over 5 years?
3. Calculate SIP of ₹10000 for 15 years at 12%
4. Compare @Axis Bluechip and @Parag Parikh Flexi Cap
5. Show NAV trend chart for scheme 119551
```

## Tech Stack

- **Backend**: Express.js, OpenAI Agents SDK
- **Frontend**: Vanilla JS, ApexCharts
- **AI**: Google Gemini 2.5 Flash
- **Math**: mathjs (accurate calculations)
- **Data**: Local JSON (223K+ schemes)

Enjoy analyzing mutual funds! 🚀
