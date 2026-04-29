import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DashboardCharts } from "@/components/DashboardCharts";
import {
  buildMonthChartData,
  buildWeekChartData,
  formatDateLabel,
  formatDuration,
  formatHeartCadenceLine,
  formatPaceMinPerKm,
} from "@/lib/format";
import { DashboardWeather } from "@/components/DashboardWeather";
import { getWeatherSnapshot } from "@/lib/kma-weather";
import { prisma } from "@/lib/prisma";
import { monthRange, weekRange } from "@/lib/week";

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
  const isMonth = pickParam(searchParams.range) === "month";
  const anchor = new Date();
  const { start, end } = isMonth ? monthRange(anchor) : weekRange(anchor);

  const [periodRuns, recentRuns, periodTotals, weather] = await Promise.all([
    prisma.run.findMany({
      where: { userId, date: { gte: start, lt: end } },
      orderBy: { date: "asc" },
    }),
    prisma.run.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 5,
    }),
    prisma.run.aggregate({
      where: { userId, date: { gte: start, lt: end } },
      _sum: { distanceKm: true, durationSec: true },
      _count: true,
    }),
    getWeatherSnapshot(),
  ]);

  const chartData = isMonth
    ? buildMonthChartData(start, periodRuns)
    : buildWeekChartData(start, periodRuns);
  const totalKm = Number(periodTotals._sum.distanceKm ?? 0);
  const totalSec = periodTotals._sum.durationSec ?? 0;
  const runCount = periodTotals._count;

  const monthTitle = isMonth
    ? new Intl.DateTimeFormat("ko-KR", {
        year: "numeric",
        month: "long",
      }).format(start)
    : null;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-h1 font-bold text-foreground">대시보드</h1>
          <p className="mt-1 text-muted">
            안녕하세요, {session?.user?.name ?? session?.user?.email ?? "러너"}님
          </p>
        </div>
        <div className="shrink-0 sm:max-w-[min(100%,16rem)] sm:pt-0.5">
          <DashboardWeather data={weather} />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-card border border-border bg-surface p-4 shadow-card">
          <p className="text-caption font-medium text-muted">
            {isMonth ? "이번 달 횟수" : "이번 주 횟수"}
          </p>
          <p className="mt-1 font-numeric text-2xl font-bold text-foreground">
            {runCount}
          </p>
        </div>
        <div className="rounded-card border border-border bg-surface p-4 shadow-card">
          <p className="text-caption font-medium text-muted">
            {isMonth ? "이번 달 거리" : "이번 주 거리"}
          </p>
          <p className="mt-1 font-numeric text-2xl font-bold text-foreground">
            {Math.round(totalKm * 100) / 100}
            <span className="ml-1 text-body font-normal text-muted">km</span>
          </p>
        </div>
        <div className="rounded-card border border-border bg-surface p-4 shadow-card">
          <p className="text-caption font-medium text-muted">
            {isMonth ? "이번 달 시간" : "이번 주 시간"}
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
              {isMonth ? "이번 달 거리" : "이번 주 거리"}
            </h2>
            {isMonth && monthTitle ? (
              <p className="mt-1 text-caption text-muted">
                {monthTitle} · 일별 합산
              </p>
            ) : (
              <p className="mt-1 text-caption text-muted">요일별 합산</p>
            )}
          </div>
          <div className="flex shrink-0 gap-1 rounded-button border border-border bg-bg p-1">
            <Link
              href="/dashboard"
              scroll={false}
              className={`rounded-md px-3 py-2 text-center text-caption font-semibold transition sm:min-w-[5.5rem] ${
                !isMonth
                  ? "bg-accent text-accent-foreground"
                  : "text-muted hover:bg-surface hover:text-foreground"
              }`}
            >
              이번 주
            </Link>
            <Link
              href="/dashboard?range=month"
              scroll={false}
              className={`rounded-md px-3 py-2 text-center text-caption font-semibold transition sm:min-w-[5.5rem] ${
                isMonth
                  ? "bg-accent text-accent-foreground"
                  : "text-muted hover:bg-surface hover:text-foreground"
              }`}
            >
              이번 달
            </Link>
          </div>
        </div>
        {periodRuns.length === 0 ? (
          <p className="rounded-card border border-dashed border-border bg-surface p-8 text-center text-muted">
            기록을 추가하면 차트가 표시됩니다.
          </p>
        ) : (
          <DashboardCharts
            data={chartData}
            variant={isMonth ? "month" : "week"}
          />
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
