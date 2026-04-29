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

export function DashboardCharts({
  data,
  variant = "week",
}: {
  data: { label: string; km: number }[];
  variant?: "week" | "month";
}) {
  const isMonth = variant === "month";
  const hasChartData = data.length > 0 && data.some((d) => d.km > 0);
  const bottom = isMonth ? 28 : 4;
  const xTick = isMonth
    ? { fontSize: 10, fill: "var(--color-text-muted)", angle: -40, textAnchor: "end" as const }
    : { fontSize: 12, fill: "var(--color-text-muted)" };

  return (
    <div
      className={`w-full rounded-card border border-border bg-surface p-2 shadow-card ${isMonth ? "h-[300px]" : "h-[260px]"}`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom }}>
          <CartesianGrid stroke="var(--color-chart-grid)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={xTick}
            interval={0}
            height={isMonth ? 40 : 24}
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
              labelFormatter={(label) =>
                isMonth ? `${label}일` : `${label}요일`
              }
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
