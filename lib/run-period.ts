import type { Prisma } from "@prisma/client";
import { monthRange, weekRange, yearRange } from "@/lib/week";

/** 대시보드·랭킹에서 공통으로 쓰는 기간 구분 */
export type RunPeriodRange = "week" | "month" | "year" | "all";

export function parseRunPeriod(param: string | undefined): RunPeriodRange {
  if (param === "month" || param === "year" || param === "all") return param;
  return "week";
}

/** Run.date 필터 (전체 기간이면 undefined) */
export function runDateFilterForPeriod(
  period: RunPeriodRange,
  anchor = new Date(),
): Prisma.DateTimeFilter | undefined {
  if (period === "all") return undefined;
  const { start, end } =
    period === "month"
      ? monthRange(anchor)
      : period === "year"
        ? yearRange(anchor)
        : weekRange(anchor);
  return { gte: start, lt: end };
}
