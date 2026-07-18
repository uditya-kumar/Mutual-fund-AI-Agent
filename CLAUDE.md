# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Backend and frontend are separate npm projects. Root `package.json` orchestrates both.

```bash
# Frontend dev server (Vite, http://localhost:5173, proxies /api → :3000)
npm run dev

# Backend (Express, http://localhost:3000) — needs OPENAI_API_KEY in .env
npm run server

# Production build of the frontend into frontend/dist
npm run build
```

Local development requires **both** `npm run dev` and `npm run server` running: the UI is served by Vite with hot reload, and its `/api/*` calls are proxied to the Express backend. There is no test suite or linter configured. `npm install` in the root installs backend deps; frontend deps live in `frontend/` (installed by `npm run build`, or manually via `npm --prefix frontend install`).

## Architecture

Chat app for analyzing Indian mutual funds. A React frontend talks to an Express backend that runs an OpenAI Agents SDK agent with tool-calling.

### Three top-level units

- **`agent/`** — the AI agent, built on `@openai/agents`.
  - `agent.js` connects everything: an **input guardrail** agent (rejects non-finance queries via a tripwire) + the main "Mutual Fund Advisor" agent wired to the tools. Exports `agent` and `runChat(message)`. No CLI — it's a library module imported by the backend.
  - `tools/` — **one file per tool**, each a named `tool({...})` export. Data tools hit the hosted Upstox proxy API (`config.js` → `API_BASE_URL`).
  - `config.js` — shared `API_BASE_URL`.
- **`api/`** — Express backend.
  - `server.js` is the entry point (bootstraps Express, serves `frontend/dist`, mounts routes under `/api`, starts the server).
  - `routes/` — **one file per route**, each exporting an Express `Router`: `chat.route.js` (POST `/api/chat`), `health.route.js`, `searchFunds.route.js` (Upstox search proxy to avoid browser CORS).
- **`frontend/`** — React + Vite + TypeScript. All source under `frontend/src/`.

### Request flow

`/api/chat` is **not** token-streamed. The route sends a `status` SSE frame, awaits the full `runChat()` result, then sends one `message` frame + `done`. Frame types: `status`, `message`, `error`, `done` (see `frontend/src/lib/api.ts` `ChatEvent`). Adding a frame type means updating both the route and `api.ts`.

### Chart rendering contract (the key cross-cutting design)

Charts are **interactive Recharts components**, not images. The seam:

1. The `generate_chart` tool (`agent/tools/generateChart.js`) returns a JSON **chart spec** — `{ type:"chart", chartType, title, xKey, series, data }` — where `data` is Recharts row format.
2. The agent is instructed (in `agent/agent.js`) to echo that JSON **verbatim inside a ` ```chart ` fenced code block** in its reply.
3. The frontend `parseMessage()` (`frontend/src/lib/markdown.ts`) splits an agent message into ordered segments of markdown HTML and chart specs; `Chart.tsx` renders each spec (line/area/bar/pie).

Agent messages are stored as **raw text** and parsed at render time, so charts re-theme on light/dark toggle. Chart colors come from the validated categorical palette in `frontend/src/lib/chartColors.ts` (do not hand-pick chart hues — extend that file).

### Frontend notes

- Agent markdown is rendered with `marked` + sanitized with `DOMPurify` (`renderMarkdown`); a malformed ` ```chart ` block safely falls back to plain markdown.
- `@`-triggered fund autocomplete in `ChatInput.tsx` calls `/api/search-funds`.
- Theme is light/dark via a `dark-mode` class on `<body>` (`useTheme`).

## Conventions

- ES modules throughout (`"type": "module"`); backend is plain JS, frontend is TypeScript (`.tsx`).
- Tool files and route files follow the **one-concern-per-file** pattern — add a new tool as `agent/tools/<name>.js` and register it in `agent/agent.js`; add a new route as `api/routes/<name>.route.js` and mount it in `api/server.js`.
- Deployment: `vercel.json` routes all traffic to `api/server.js`.

> Note: `README.md` predates the current refactor (it references `agent.js`/`server.js` at the root, a `public/` vanilla-JS UI, QuickChart images, and an `npm run cli`) — none of that reflects the current code. Trust the source layout above over the README.
