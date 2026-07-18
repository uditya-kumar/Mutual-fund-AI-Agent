import { tool } from "@openai/agents";
import { z } from "zod";

// Tool: Generate charts using QuickChart.io API
export const generateChart = tool({
  name: "generate_chart",
  description:
    "Generate visual charts for mutual fund data using QuickChart. Returns a short chart URL.",
  parameters: z.object({
    chartType: z
      .string()
      .describe("Type of chart: line, bar, pie, doughnut, radar"),
    title: z.string().describe("Chart title"),
    labels: z
      .array(z.string())
      .describe("Labels for the data points"),
    datasets: z
      .array(
        z.object({
          label: z.string().describe("Dataset label"),
          data: z.array(z.number()).describe("Data values"),
        })
      )
      .describe("Datasets to plot"),
  }),
  async execute({ chartType, title, labels, datasets }) {
    console.log("🔨 Calling Generate Chart tool");
    try {
      const chartConfig = {
        type: chartType,
        data: {
          labels: labels,
          datasets: datasets.map((ds, index) => ({
            label: ds.label,
            data: ds.data,
            borderColor: `hsl(${index * 60}, 70%, 50%)`,
            backgroundColor: `hsla(${index * 60}, 70%, 50%, 0.2)`,
            fill: chartType === "line" ? true : undefined,
            tension: chartType === "line" ? 0.4 : undefined,
          })),
        },
        options: {
          responsive: true,
          plugins: {
            title: { display: true, text: title, font: { size: 16 }, color: "#e8e8e8" },
            legend: { display: true, position: "bottom", labels: { color: "#e8e8e8" } },
          },
          scales:
            chartType === "line" || chartType === "bar"
              ? {
                  y: { beginAtZero: false, ticks: { color: "#888" }, grid: { color: "#2a2a2a" } },
                  x: { ticks: { color: "#888" }, grid: { color: "#2a2a2a" } },
                }
              : undefined,
        },
      };

      const response = await fetch("https://quickchart.io/chart/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ backgroundColor: "black", width: 800, height: 400, chart: chartConfig }),
      });

      const result = await response.json();

      if (result.success && result.url) {
        return JSON.stringify({ type: "CHART", url: result.url, title: title });
      } else {
        const chartUrl = `https://quickchart.io/chart?backgroundColor=black&c=${encodeURIComponent(JSON.stringify(chartConfig))}&w=800&h=400`;
        return JSON.stringify({ type: "CHART", url: chartUrl, title: title });
      }
    } catch (error) {
      return JSON.stringify({ error: error.message });
    }
  },
});
