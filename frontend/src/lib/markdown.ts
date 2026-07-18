import { marked } from "marked";
import DOMPurify from "dompurify";

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

/** Build the sanitized HTML for a chart image link. */
export function renderChartLink(url: string): string {
  const safeUrl = DOMPurify.sanitize(url);
  return `<div class="chart-container"><a href="${safeUrl}" target="_blank" rel="noopener noreferrer"><img src="${safeUrl}" alt="Chart" style="max-width: 100%; border-radius: 8px;"></a></div>`;
}
