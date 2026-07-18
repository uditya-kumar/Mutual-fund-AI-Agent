import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import type { ChartSpec, Theme } from "../types";
import { getChartTheme, seriesColor } from "../lib/chartColors";

interface ChartProps {
  spec: ChartSpec;
  theme: Theme;
}

/** Renders an agent chart spec as an interactive Recharts figure. */
export function Chart({ spec, theme }: ChartProps) {
  const t = getChartTheme(theme);

  const tooltipStyle = {
    background: t.tooltipBg,
    border: `1px solid ${t.tooltipBorder}`,
    borderRadius: 8,
    color: t.text,
    fontSize: 13,
  };

  const axisProps = {
    stroke: t.axis,
    tick: { fill: t.text, fontSize: 12 },
  };

  return (
    <figure className="chart-figure">
      <figcaption className="chart-title">{spec.title}</figcaption>
      <ResponsiveContainer width="100%" height={300}>
        {renderChart(spec, theme, t, tooltipStyle, axisProps)}
      </ResponsiveContainer>
    </figure>
  );
}

function renderChart(
  spec: ChartSpec,
  theme: Theme,
  t: ReturnType<typeof getChartTheme>,
  tooltipStyle: React.CSSProperties,
  axisProps: { stroke: string; tick: { fill: string; fontSize: number } }
) {
  const { chartType, data, xKey, series } = spec;
  const showLegend = series.length > 1;

  switch (chartType) {
    case "area":
      return (
        <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={t.grid} vertical={false} />
          <XAxis dataKey={xKey} {...axisProps} />
          <YAxis {...axisProps} />
          <Tooltip contentStyle={tooltipStyle} />
          {showLegend && <Legend wrapperStyle={{ fontSize: 13 }} />}
          {series.map((name, i) => (
            <Area
              key={name}
              type="monotone"
              dataKey={name}
              stroke={seriesColor(theme, i)}
              fill={seriesColor(theme, i)}
              fillOpacity={0.15}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </AreaChart>
      );

    case "bar":
      return (
        <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={t.grid} vertical={false} />
          <XAxis dataKey={xKey} {...axisProps} />
          <YAxis {...axisProps} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: t.grid, opacity: 0.4 }} />
          {showLegend && <Legend wrapperStyle={{ fontSize: 13 }} />}
          {series.map((name, i) => (
            <Bar
              key={name}
              dataKey={name}
              fill={seriesColor(theme, i)}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      );

    case "pie": {
      // Pie uses the first series as slice values, xKey as slice names.
      const sliceKey = series[0];
      return (
        <PieChart>
          <Tooltip contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 13 }} />
          <Pie
            data={data}
            dataKey={sliceKey}
            nameKey={xKey}
            cx="50%"
            cy="50%"
            outerRadius={100}
            stroke={t.surface}
            strokeWidth={2}
            label
          >
            {data.map((_, i) => (
              <Cell key={i} fill={seriesColor(theme, i)} />
            ))}
          </Pie>
        </PieChart>
      );
    }

    case "line":
    default:
      return (
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={t.grid} vertical={false} />
          <XAxis dataKey={xKey} {...axisProps} />
          <YAxis {...axisProps} />
          <Tooltip contentStyle={tooltipStyle} />
          {showLegend && <Legend wrapperStyle={{ fontSize: 13 }} />}
          {series.map((name, i) => (
            <Line
              key={name}
              type="monotone"
              dataKey={name}
              stroke={seriesColor(theme, i)}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          ))}
        </LineChart>
      );
  }
}
