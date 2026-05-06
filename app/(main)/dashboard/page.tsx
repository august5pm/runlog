import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  DashboardCharts,
  type DashboardChartVariant,
} from "@/components/DashboardCharts";
import {
  buildAllTimeChartData,
  buildMonthChartData,
  buildWeekChartData,
  buildYearChartData,
  formatDateLabel,
  formatDuration,
  formatHeartCadenceLine,
  formatPaceMinPerKm,
} from "@/lib/format";
import { DashboardWeather } from "@/components/DashboardWeather";
import { getWeatherSnapshot } from "@/lib/kma-weather";
import { prisma } from "@/lib/prisma";
import { parseRunPeriod, runDateFilterForPeriod } from "@/lib/run-period";
import { getRunningStreakDays } from "@/lib/run-streak";
import { resolveDisplayName } from "@/lib/user-display";
import { monthRange, weekRange, yearRange } from "@/lib/week";

function pickParam(
  value: string | string[] | undefined,
): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0];
  return undefined;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const session = await getServerSession(authOptions);
  const userId = session!.user!.id;
  const range = parseRunPeriod(pickParam(searchParams.range));
  const anchor = new Date();
  const dateFilter = runDateFilterForPeriod(range, anchor);
  const runWhere = {
    userId,
    ...(dateFilter ? { date: dateFilter } : {}),
  };

  const wr = weekRange(anchor);
  const mr = monthRange(anchor);

  const [
    periodRuns,
    recentRuns,
    periodTotals,
    weather,
    goalsUser,
    streakDays,
    weekGoalAgg,
    monthGoalAgg,
  ] = await Promise.all([
    prisma.run.findMany({
      where: runWhere,
      orderBy: { date: "asc" },
    }),
    prisma.run.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 5,
    }),
    prisma.run.aggregate({
      where: runWhere,
      _sum: { distanceKm: true, durationSec: true },
      _count: true,
    }),
    getWeatherSnapshot(),
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        weeklyDistanceGoalKm: true,
        monthlyDistanceGoalKm: true,
      },
    }),
    getRunningStreakDays(userId),
    prisma.run.aggregate({
      where: { userId, date: { gte: wr.start, lt: wr.end } },
      _sum: { distanceKm: true },
    }),
    prisma.run.aggregate({
      where: { userId, date: { gte: mr.start, lt: mr.end } },
      _sum: { distanceKm: true },
    }),
  ]);

  const weekGoalKm =
    goalsUser?.weeklyDistanceGoalKm != null
      ? Number(goalsUser.weeklyDistanceGoalKm)
      : null;
  const monthGoalKm =
    goalsUser?.monthlyDistanceGoalKm != null
      ? Number(goalsUser.monthlyDistanceGoalKm)
      : null;
  const weekDoneKm = Number(weekGoalAgg._sum.distanceKm ?? 0);
  const monthDoneKm = Number(monthGoalAgg._sum.distanceKm ?? 0);

  function goalPercent(done: number, goal: number | null): number | null {
    if (goal == null || goal <= 0) return null;
    return Math.min(100, Math.round((done / goal) * 1000) / 10);
  }

  const weekGoalPct = goalPercent(weekDoneKm, weekGoalKm);
  const monthGoalPct = goalPercent(monthDoneKm, monthGoalKm);

  const chartStart =
    range === "month"
      ? monthRange(anchor).start
      : range === "year"
        ? yearRange(anchor).start
        : weekRange(anchor).start;

  const chartData =
    range === "week"
      ? buildWeekChartData(chartStart, periodRuns)
      : range === "month"
        ? buildMonthChartData(chartStart, periodRuns)
        : range === "year"
          ? buildYearChartData(chartStart, periodRuns)
          : buildAllTimeChartData(periodRuns);

  const totalKm = Number(periodTotals._sum.distanceKm ?? 0);
  const totalSec = periodTotals._sum.durationSec ?? 0;
  const runCount = periodTotals._count;

  const monthTitle =
    range === "month"
      ? new Intl.DateTimeFormat("ko-KR", {
          year: "numeric",
          month: "long",
        }).format(chartStart)
      : null;

  const yearNum = chartStart.getFullYear();

  const summaryLabel =
    range === "week"
      ? "이번 주"
      : range === "month"
        ? "이번 달"
        : range === "year"
          ? "올해"
          : "전체";

  const chartHeading =
    range === "week"
      ? "이번 주 거리"
      : range === "month"
        ? "이번 달 거리"
        : range === "year"
          ? "올해 거리"
          : "전체 기간 거리";

  const chartCaption =
    range === "week"
      ? "요일별 합산"
      : range === "month" && monthTitle
        ? `${monthTitle} · 일별 합산`
        : range === "year"
          ? `${yearNum}년 · 월별 합산`
          : range === "all"
            ? "월별 합산"
            : "";

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-h1 font-bold text-foreground">대시보드</h1>
          <p className="mt-1 text-muted">
            안녕하세요,{" "}
            {session?.user ? resolveDisplayName(session.user) : "러너"}님
          </p>
        </div>
        <div className="shrink-0 sm:max-w-[min(100%,16rem)] sm:pt-0.5">
          <DashboardWeather data={weather} />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-card border border-border bg-surface p-4 shadow-card">
          <p className="text-caption font-medium text-muted">연속 기록</p>
          <p className="mt-1 font-numeric text-2xl font-bold text-foreground">
            {streakDays}
            <span className="ml-1 text-body font-semibold text-muted">일</span>
          </p>
          <p className="mt-2 text-[11px] leading-snug text-subtle">
            오늘 또는 어제에 기록이 있어야 이어집니다.
          </p>
        </div>
        <div className="rounded-card border border-border bg-surface p-4 shadow-card">
          <p className="text-caption font-medium text-muted">이번 주 목표</p>
          {weekGoalKm != null && weekGoalKm > 0 ? (
            <>
              <p className="mt-1 font-numeric text-lg font-bold tabular-nums text-foreground">
                {Math.round(weekDoneKm * 100) / 100}
                <span className="mx-0.5 font-normal text-muted">/</span>
                {weekGoalKm}
                <span className="ml-1 text-body font-normal text-muted">km</span>
              </p>
              <div
                className="mt-2 h-2 w-full overflow-hidden rounded-full bg-border"
                role="progressbar"
                aria-valuenow={weekGoalPct ?? 0}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="이번 주 목표 달성률"
              >
                <div
                  className="h-full min-w-0 rounded-full bg-accent transition-[width]"
                  style={{ width: `${weekGoalPct ?? 0}%` }}
                />
              </div>
              <p className="mt-1 text-caption text-muted">
                {weekGoalPct}% 달성
              </p>
            </>
          ) : (
            <>
              <p className="mt-1 text-caption text-muted">목표 미설정</p>
              <Link
                href="/settings"
                className="mt-2 inline-block text-caption font-semibold text-accent hover:underline"
              >
                설정에서 정하기 →
              </Link>
            </>
          )}
        </div>
        <div className="rounded-card border border-border bg-surface p-4 shadow-card">
          <p className="text-caption font-medium text-muted">이번 달 목표</p>
          {monthGoalKm != null && monthGoalKm > 0 ? (
            <>
              <p className="mt-1 font-numeric text-lg font-bold tabular-nums text-foreground">
                {Math.round(monthDoneKm * 100) / 100}
                <span className="mx-0.5 font-normal text-muted">/</span>
                {monthGoalKm}
                <span className="ml-1 text-body font-normal text-muted">km</span>
              </p>
              <div
                className="mt-2 h-2 w-full overflow-hidden rounded-full bg-border"
                role="progressbar"
                aria-valuenow={monthGoalPct ?? 0}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="이번 달 목표 달성률"
              >
                <div
                  className="h-full min-w-0 rounded-full bg-accent transition-[width]"
                  style={{ width: `${monthGoalPct ?? 0}%` }}
                />
              </div>
              <p className="mt-1 text-caption text-muted">
                {monthGoalPct}% 달성
              </p>
            </>
          ) : (
            <>
              <p className="mt-1 text-caption text-muted">목표 미설정</p>
              <Link
                href="/settings"
                className="mt-2 inline-block text-caption font-semibold text-accent hover:underline"
              >
                설정에서 정하기 →
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-card border border-border bg-surface p-4 shadow-card">
          <p className="text-caption font-medium text-muted">
            {summaryLabel} 횟수
          </p>
          <p className="mt-1 font-numeric text-2xl font-bold text-foreground">
            {runCount}
          </p>
        </div>
        <div className="rounded-card border border-border bg-surface p-4 shadow-card">
          <p className="text-caption font-medium text-muted">
            {summaryLabel} 거리
          </p>
          <p className="mt-1 font-numeric text-2xl font-bold text-foreground">
            {Math.round(totalKm * 100) / 100}
            <span className="ml-1 text-body font-normal text-muted">km</span>
          </p>
        </div>
        <div className="rounded-card border border-border bg-surface p-4 shadow-card">
          <p className="text-caption font-medium text-muted">
            {summaryLabel} 시간
          </p>
          <p className="mt-1 font-numeric text-2xl font-bold text-foreground">
            {totalSec > 0 ? formatDuration(totalSec) : "—"}
          </p>
        </div>
      </div>

      <section>
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-h2 font-semibold text-foreground">
              {chartHeading}
            </h2>
            {chartCaption ? (
              <p className="mt-1 text-caption text-muted">{chartCaption}</p>
            ) : null}
          </div>
          <div className="flex max-w-full shrink-0 flex-wrap gap-1 rounded-button border border-border bg-bg p-1">
            {(
              [
                { href: "/dashboard", value: "week" as const, label: "주" },
                {
                  href: "/dashboard?range=month",
                  value: "month" as const,
                  label: "월",
                },
                {
                  href: "/dashboard?range=year",
                  value: "year" as const,
                  label: "년",
                },
                {
                  href: "/dashboard?range=all",
                  value: "all" as const,
                  label: "전체",
                },
              ] as const
            ).map(({ href, value, label }) => (
              <Link
                key={value}
                href={href}
                scroll={false}
                className={`rounded-md px-2.5 py-2 text-center text-caption font-semibold transition sm:min-w-[3.25rem] sm:px-3 ${
                  range === value
                    ? "bg-accent text-accent-foreground"
                    : "text-muted hover:bg-surface hover:text-foreground"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
        {periodRuns.length === 0 ? (
          <p className="rounded-card border border-dashed border-border bg-surface p-8 text-center text-muted">
            기록을 추가하면 차트가 표시됩니다.
          </p>
        ) : (
          <DashboardCharts data={chartData} variant={range} />
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-h2 font-semibold text-foreground">최근 기록</h2>
          <Link
            href="/runs/new"
            className="rounded-button bg-accent px-3 py-2 text-caption font-semibold text-accent-foreground hover:bg-accent-hover md:hidden"
          >
            기록 추가
          </Link>
        </div>
        {recentRuns.length === 0 ? (
          <p className="text-muted">아직 기록이 없습니다.</p>
        ) : (
          <ul className="space-y-2">
            {recentRuns.map((r) => {
              const heartCadence = formatHeartCadenceLine(
                r.avgHeartRate,
                r.cadence,
              );
              return (
                <li key={r.id}>
                  <Link
                    href={`/runs/${r.id}/edit`}
                    className="block rounded-card border border-border bg-surface p-4 shadow-card transition hover:border-accent"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="font-medium text-foreground">
                        {formatDateLabel(r.date)}
                      </span>
                      <span className="font-numeric text-caption text-muted">
                        {Number(r.distanceKm)} km ·{" "}
                        {formatPaceMinPerKm(
                          r.durationSec,
                          Number(r.distanceKm),
                        )}{" "}
                        /km
                      </span>
                    </div>
                    {heartCadence ? (
                      <p className="mt-1 font-numeric text-caption text-muted">
                        {heartCadence}
                      </p>
                    ) : null}
                    {r.notes ? (
                      <p className="mt-1 line-clamp-2 text-caption text-muted">
                        {r.notes}
                      </p>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        <div className="mt-4 hidden md:block">
          <Link
            href="/runs"
            className="text-caption font-semibold text-accent hover:underline"
          >
            전체 기록 보기 →
          </Link>
        </div>
      </section>

      <Link
        href="/runs/new"
        className="fixed bottom-24 right-4 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-2xl font-bold text-accent-foreground shadow-fab hover:bg-accent-hover md:bottom-8"
        aria-label="기록 추가"
      >
        +
      </Link>
    </div>
  );
}
