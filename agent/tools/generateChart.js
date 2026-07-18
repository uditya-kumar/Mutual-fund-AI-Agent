import { tool } from "@openai/agents";
import { z } from "zod";

// Tool: Build a structured chart specification.
//
// This no longer renders an image. It returns a Recharts-ready spec that the
// frontend renders as an interactive chart. The agent chooses the chart type
// and must echo the returned JSON verbatim inside a ```chart fenced code block
// so the UI can pick it up (see agent instructions).
export const generateChart = tool({
  name: "generate_chart",
  description:
    "Build an interactive chart from data. Returns a JSON chart specification (NOT an image) that the frontend renders with Recharts. Choose the chartType that best fits the data: 'line' for trends over time (e.g. NAV history), 'area' for cumulative growth, 'bar' for comparing discrete values across funds/periods, 'pie' for composition/allocation. After calling this tool, output the returned JSON EXACTLY as-is inside a ```chart fenced code block.",
  parameters: z.object({
    chartType: z
      .enum(["line", "area", "bar", "pie"])
      .describe("The chart type that best fits the data"),
    title: z.string().describe("Chart title"),
    labels: z
      .array(z.string())
      .describe(
        "X-axis category labels, one per data point (e.g. dates or periods). For a pie chart these are the slice names."
      ),
    datasets: z
      .array(
        z.object({
          label: z.string().describe("Series name (shown in legend/tooltip)"),
          data: z
            .array(z.number())
            .describe("Numeric values aligned with `labels`"),
        })
      )
      .describe(
        "One or more data series. For a pie chart, provide a single series."
      ),
  }),
  async execute({ chartType, title, labels, datasets }) {
    console.log("🔨 Calling Generate Chart tool");
    try {
      if (!labels.length || !datasets.length) {
        return JSON.stringify({
          error: "Chart needs at least one label and one dataset.",
        });
      }

      const series = datasets.map((ds) => ds.label);

      // Transform the labels + datasets into Recharts row format:
      // one object per label, with a key for the x-axis and one key per series.
      const data = labels.map((label, i) => {
        const row = { name: label };
        for (const ds of datasets) {
          row[ds.label] = ds.data[i] ?? null;
        }
        return row;
      });

      const spec = {
        type: "chart",
        chartType,
        title,
        xKey: "name",
        series,
        data,
      };

      return JSON.stringify(spec);
    } catch (error) {
      return JSON.stringify({ error: error.message });
    }
  },
});
