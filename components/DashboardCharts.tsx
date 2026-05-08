"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/** Tailwind `sm` 미만 — 월 차트만 아래에서 가로 스크롤 적용 */
function useViewportBelowSm(): boolean {
  const [narrow, setNarrow] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const apply = () => setNarrow(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return narrow;
}

export type DashboardChartVariant = "week" | "month" | "year" | "all";

const axisStroke = "var(--color-border)";

export function DashboardCharts({
  data,
  variant = "week",
}: {
  data: { label: string; km: number }[];
  variant?: DashboardChartVariant;
}) {
  const viewportBelowSm = useViewportBelowSm();
  const isWeek = variant === "week";
  const isMonth = variant === "month";
  /** 두 개의 BarChart로 Y축만 고정하면 Recharts가 플롯 높이·X축 대역을 서로 다르게 잡아 0km·X축이 어긋남 → 좁은 화면은 단일 차트 + 가로 스크롤 */
  const monthNarrowHorizontalScroll = isMonth && viewportBelowSm;
  const hasChartData = data.length > 0 && data.some((d) => d.km > 0);
  const tilted =
    variant === "month" || variant === "year" || variant === "all";
  const denseTicks = variant === "all" && data.length > 14;
  /** 주·월·년·전체 동일 — 기존 월/년/전체는 28~36이라 카드 하단 여백만 커 보였음 */
  const chartMarginBottom = 4;
  const xTick = isWeek
    ? { fontSize: 12, fill: "var(--color-text-muted)" }
    : {
        fontSize: denseTicks ? 9 : 10,
        fill: "var(--color-text-muted)",
        angle: -40,
        textAnchor: "end" as const,
      };
  const xInterval = denseTicks ? Math.max(1, Math.floor(data.length / 10)) : 0;

  /** 월·좁은 화면: 일자 라벨 간격 확보용 최소 너비 */
  const monthScrollMinWidthPx = Math.max(400, data.length * 26 + 24);
  /** 월은 카드·X축 대역을 주에 가깝게 — 과도한 height가 하단 빈 여백으로 보임 */
  const xAxisHeight = isWeek
    ? 24
    : variant === "month"
      ? 30
      : tilted
        ? 44
        : 24;

  const tooltipEl = hasChartData ? (
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
  ) : null;

  const chart = (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{ top: 8, right: 8, left: 0, bottom: chartMarginBottom }}
        barCategoryGap={isMonth ? "22%" : "10%"}
      >
        <CartesianGrid stroke="var(--color-chart-grid)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={xTick}
          interval={xInterval}
          height={xAxisHeight}
        />
        <YAxis
          width={40}
          tick={{ fontSize: 12, fill: "var(--color-text-muted)" }}
          unit="km"
          axisLine={{ stroke: axisStroke }}
          tickLine={{ stroke: axisStroke }}
        />
        {tooltipEl}
        <Bar
          dataKey="km"
          fill="var(--color-chart-primary)"
          radius={[8, 8, 0, 0]}
          name="거리"
          activeBar={false}
        />
      </BarChart>
    </ResponsiveContainer>
  );

  return (
    <div
      className={`flex w-full flex-col rounded-card border border-border bg-surface p-2 shadow-card ${isWeek || isMonth ? "h-[260px]" : "h-[300px]"}`}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        {monthNarrowHorizontalScroll ? (
          <div className="min-h-0 flex-1 overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]">
            <div
              className="h-full min-h-[200px]"
              style={{
                width: `max(100%, ${monthScrollMinWidthPx}px)`,
              }}
            >
              {chart}
            </div>
          </div>
        ) : (
          chart
        )}
      </div>
    </div>
  );
}
