"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type DashboardChartVariant = "week" | "month" | "year" | "all";

export function DashboardCharts({
  data,
  variant = "week",
}: {
  data: { label: string; km: number }[];
  variant?: DashboardChartVariant;
}) {
  const isWeek = variant === "week";
  const hasChartData = data.length > 0 && data.some((d) => d.km > 0);
  const tilted =
    variant === "month" || variant === "year" || variant === "all";
  const denseTicks = variant === "all" && data.length > 14;
  const bottom = isWeek ? 4 : denseTicks ? 36 : 28;
  const xTick = isWeek
    ? { fontSize: 12, fill: "var(--color-text-muted)" }
    : {
        fontSize: denseTicks ? 9 : 10,
        fill: "var(--color-text-muted)",
        angle: -40,
        textAnchor: "end" as const,
      };
  const xInterval = denseTicks ? Math.max(1, Math.floor(data.length / 10)) : 0;

  return (
    <div
      className={`w-full rounded-card border border-border bg-surface p-2 shadow-card ${isWeek ? "h-[260px]" : "h-[300px]"}`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom }}>
          <CartesianGrid stroke="var(--color-chart-grid)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={xTick}
            interval={xInterval}
            height={isWeek ? 24 : tilted ? 44 : 24}
          />
          <YAxis
            width={40}
            tick={{ fontSize: 12, fill: "var(--color-text-muted)" }}
            unit="km"
          />
          {hasChartData ? (
            <Tooltip
              cursor={false}
              contentStyle={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "8px",
              }}
              labelFormatter={(label) => {
                if (variant === "week") return `${label}요일`;
                if (variant === "month") return `${label}일`;
                return String(label);
              }}
              formatter={(value: number) => [`${value} km`, "거리"]}
            />
          ) : null}
          <Bar
            dataKey="km"
            fill="var(--color-chart-primary)"
            radius={[6, 6, 0, 0]}
            name="거리"
            activeBar={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
