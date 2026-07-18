export type Role = "user" | "agent";

export interface ChatMessage {
  id: string;
  role: Role;
  /**
   * Raw text. For user messages this is plain text rendered as-is; for agent
   * messages this is markdown (which may contain ```chart blocks) parsed and
   * rendered at display time.
   */
  content: string;
}

export interface Fund {
  schemeName: string;
  schemeCode: string;
  category: string;
}

export type Theme = "dark" | "light";

export type ChartType = "line" | "area" | "bar" | "pie";

/** Structured chart spec emitted by the agent's generate_chart tool. */
export interface ChartSpec {
  type: "chart";
  chartType: ChartType;
  title: string;
  /** Key in each data row used for the x-axis / pie slice name. */
  xKey: string;
  /** Series names — each is a numeric key present on every data row. */
  series: string[];
  data: Array<Record<string, string | number | null>>;
}

/** A parsed segment of an agent message: either markdown HTML or a chart. */
export type MessageSegment =
  | { kind: "html"; html: string }
  | { kind: "chart"; spec: ChartSpec };
