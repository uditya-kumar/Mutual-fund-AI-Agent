import { marked } from "marked";
import DOMPurify from "dompurify";
import type { ChartSpec, MessageSegment } from "../types";

// Force all rendered markdown links to open in a new tab safely.
DOMPurify.addHook("afterSanitizeAttributes", (node) => {
  if (node.tagName === "A") {
    node.setAttribute("target", "_blank");
    node.setAttribute("rel", "noopener noreferrer");
  }
});

/** Render agent markdown to sanitized HTML. */
export function renderMarkdown(content: string): string {
  marked.setOptions({ breaks: true, gfm: true });
  const rawHtml = marked.parse(content, { async: false }) as string;
  return DOMPurify.sanitize(rawHtml, { ADD_ATTR: ["target"] });
}

// Matches a ```chart fenced code block and captures its JSON body.
const CHART_BLOCK = /```chart\s*\n([\s\S]*?)```/g;

function isChartSpec(value: unknown): value is ChartSpec {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    v.type === "chart" &&
    typeof v.chartType === "string" &&
    Array.isArray(v.series) &&
    Array.isArray(v.data)
  );
}

/**
 * Split an agent message into ordered segments of rendered markdown and chart
 * specs. Text around/between ```chart blocks is rendered as markdown; each
 * valid chart block becomes a chart segment. A malformed chart block falls
 * back to being rendered as normal markdown so nothing is silently dropped.
 */
export function parseMessage(content: string): MessageSegment[] {
  const segments: MessageSegment[] = [];
  let lastIndex = 0;

  const pushHtml = (text: string) => {
    if (text.trim()) segments.push({ kind: "html", html: renderMarkdown(text) });
  };

  CHART_BLOCK.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = CHART_BLOCK.exec(content)) !== null) {
    const [full, jsonBody] = match;
    let spec: ChartSpec | null = null;
    try {
      const parsed = JSON.parse(jsonBody.trim());
      if (isChartSpec(parsed)) spec = parsed;
    } catch {
      spec = null;
    }

    if (spec) {
      pushHtml(content.slice(lastIndex, match.index));
      segments.push({ kind: "chart", spec });
      lastIndex = match.index + full.length;
    }
    // If the block wasn't a valid spec, leave it in place to be rendered as
    // markdown by the trailing pushHtml below.
  }

  pushHtml(content.slice(lastIndex));

  // Nothing parsed (e.g. empty message) — still return the rendered markdown.
  if (segments.length === 0) {
    segments.push({ kind: "html", html: renderMarkdown(content) });
  }

  return segments;
}
