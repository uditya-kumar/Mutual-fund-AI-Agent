import type { Theme } from "../types";

// Validated categorical palette from the dataviz skill (fixed hue order, never
// cycled). Light and dark are the same eight hues stepped per surface.
const CATEGORICAL_LIGHT = [
  "#2a78d6", // blue
  "#008300", // green
  "#e87ba4", // magenta
  "#eda100", // yellow
  "#1baf7a", // aqua
  "#eb6834", // orange
  "#4a3aa7", // violet
  "#e34948", // red
];

const CATEGORICAL_DARK = [
  "#3987e5",
  "#008300",
  "#d55181",
  "#c98500",
  "#199e70",
  "#d95926",
  "#9085e9",
  "#e66767",
];

export interface ChartTheme {
  categorical: string[];
  grid: string;
  axis: string;
  text: string;
  surface: string;
  tooltipBg: string;
  tooltipBorder: string;
}

export function getChartTheme(theme: Theme): ChartTheme {
  if (theme === "dark") {
    return {
      categorical: CATEGORICAL_DARK,
      grid: "#2c2c2a",
      axis: "#383835",
      text: "#c3c2b7",
      surface: "#1a1a19",
      tooltipBg: "#262624",
      tooltipBorder: "rgba(255,255,255,0.12)",
    };
  }
  return {
    categorical: CATEGORICAL_LIGHT,
    grid: "#e1e0d9",
    axis: "#c3c2b7",
    text: "#52514e",
    surface: "#fcfcfb",
    tooltipBg: "#ffffff",
    tooltipBorder: "rgba(11,11,11,0.12)",
  };
}

/** Color for series slot `i`; past 8 it wraps (agent is guided to stay ≤ a few). */
export function seriesColor(theme: Theme, i: number): string {
  const palette = getChartTheme(theme).categorical;
  return palette[i % palette.length];
}
