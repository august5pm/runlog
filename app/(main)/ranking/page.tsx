import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getLeaderboard, type LeaderboardMetric } from "@/lib/leaderboard";
import {
  parseRunPeriod,
  type RunPeriodRange,
} from "@/lib/run-period";
import { formatDuration } from "@/lib/format";

function pickParam(
  value: string | string[] | undefined,
): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0];
  return undefined;
}

function parseMetric(param: string | undefined): LeaderboardMetric {
  return param === "runs" ? "runs" : "distance";
}

function periodLabel(p: RunPeriodRange): string {
  switch (p) {
    case "week":
      return "이번 주";
    case "month":
      return "이번 달";
    case "year":
      return "올해";
    case "all":
      return "전체";
  }
}

export default async function RankingPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const session = await getServerSession(authOptions);
  const userId = session!.user!.id;
  const period = parseRunPeriod(pickParam(searchParams.range));
  const metric = parseMetric(pickParam(searchParams.metric));

  const { top, me, totalParticipants } = await getLeaderboard(
    period,
    metric,
    userId,
  );

  function rankingHref(next?: {
    range?: RunPeriodRange;
    metric?: LeaderboardMetric;
  }): string {
    const r = next?.range ?? period;
    const m = next?.metric ?? metric;
    const p = new URLSearchParams();
    if (r !== "week") p.set("range", r);
    if (m !== "distance") p.set("metric", m);
    const s = p.toString();
    return s ? `/ranking?${s}` : "/ranking";
  }

  const inTopList = me && top.some((r) => r.userId === me.userId);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-h1 font-bold text-foreground">랭킹</h1>
        <p className="mt-1 text-caption text-muted">
          같은 기간 안에서 다른 러너와 거리·횟수를 비교합니다. 이메일은 표시하지
          않습니다.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex max-w-full flex-wrap gap-1 rounded-button border border-border bg-bg p-1">
          {(
            [
              { range: "week" as const, label: "주" },
              { range: "month" as const, label: "월" },
              { range: "year" as const, label: "년" },
              { range: "all" as const, label: "전체" },
            ] as const
          ).map(({ range: r, label }) => (
            <Link
              key={r}
              href={rankingHref({ range: r })}
              scroll={false}
              className={`rounded-lg px-2.5 py-2 text-center text-caption font-semibold transition sm:min-w-[3.25rem] sm:px-3 ${
                period === r
                  ? "bg-accent text-accent-foreground"
                  : "text-muted hover:bg-surface hover:text-foreground"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap gap-1 rounded-button border border-border bg-bg p-1">
          <Link
            href={rankingHref({ metric: "distance" })}
            scroll={false}
            className={`rounded-lg px-3 py-2 text-caption font-semibold transition ${
              metric === "distance"
                ? "bg-accent text-accent-foreground"
                : "text-muted hover:bg-surface hover:text-foreground"
            }`}
          >
            거리순
          </Link>
          <Link
            href={rankingHref({ metric: "runs" })}
            scroll={false}
            className={`rounded-lg px-3 py-2 text-caption font-semibold transition ${
              metric === "runs"
                ? "bg-accent text-accent-foreground"
                : "text-muted hover:bg-surface hover:text-foreground"
            }`}
          >
            횟수순
          </Link>
        </div>
      </div>

      <p className="text-caption text-subtle">
        {periodLabel(period)} · {metric === "distance" ? "총 거리" : "런 횟수"}{" "}
        기준 · 참가 {totalParticipants}명 · 상위 {top.length}명 표시
      </p>

      {me && me.runs > 0 ? (
        <div
          className={`rounded-card border p-4 shadow-card ${
            inTopList
              ? "border-accent bg-accent-muted/30"
              : "border-border bg-surface"
          }`}
        >
          <p className="text-caption font-medium text-muted">내 순위</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span
              className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-muted text-2xl leading-none"
              aria-hidden
            >
              {me.emoji}
            </span>
            <div>
              <p className="font-semibold text-foreground">{me.displayName}</p>
              <p className="mt-0.5 font-numeric text-caption text-muted">
                <span className="text-foreground">{me.rank}위</span> ·{" "}
                {Math.round(me.km * 100) / 100} km · {me.runs}회 ·{" "}
                {me.durationSec > 0 ? formatDuration(me.durationSec) : "—"}
              </p>
            </div>
          </div>
          {!inTopList && me.rank > 0 ? (
            <p className="mt-2 text-caption text-muted">
              목록에는 상위 {top.length}명만 표시됩니다.
            </p>
          ) : null}
        </div>
      ) : (
        <p className="rounded-card border border-dashed border-border bg-surface p-4 text-caption text-muted">
          이 기간에 기록이 없으면 순위에 포함되지 않습니다. 러닝을 기록해 보세요.
        </p>
      )}

      {top.length === 0 ? (
        <p className="rounded-card border border-dashed border-border bg-surface p-8 text-center text-muted">
          아직 이 기간에 등록된 기록이 없습니다.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-card border border-border bg-surface shadow-card">
          <table className="w-full min-w-[320px] text-left text-caption">
            <thead>
              <tr className="border-b border-border text-muted">
                <th className="px-3 py-2 font-medium sm:px-4">순위</th>
                <th className="px-3 py-2 font-medium sm:px-4">러너</th>
                <th className="px-3 py-2 text-right font-medium sm:px-4">
                  거리(km)
                </th>
                <th className="px-3 py-2 text-right font-medium sm:px-4">
                  횟수
                </th>
                <th className="hidden px-3 py-2 text-right font-medium sm:table-cell sm:px-4">
                  총 시간
                </th>
              </tr>
            </thead>
            <tbody>
              {top.map((row) => {
                const isMe = row.userId === userId;
                return (
                  <tr
                    key={row.userId}
                    className={`border-b border-border last:border-0 ${
                      isMe ? "bg-accent-muted/20" : ""
                    }`}
                  >
                    <td className="px-3 py-2.5 font-numeric font-semibold tabular-nums sm:px-4">
                      {row.rank}
                    </td>
                    <td className="px-3 py-2.5 sm:px-4">
                      <span className="flex items-center gap-2">
                        <span
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-muted text-lg leading-none"
                          aria-hidden
                        >
                          {row.emoji}
                        </span>
                        <span
                          className={`min-w-0 truncate font-medium ${
                            isMe ? "text-accent" : "text-foreground"
                          }`}
                        >
                          {row.displayName}
                          {isMe ? " (나)" : ""}
                        </span>
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right font-numeric tabular-nums sm:px-4">
                      {Math.round(row.km * 100) / 100}
                    </td>
                    <td className="px-3 py-2.5 text-right font-numeric tabular-nums sm:px-4">
                      {row.runs}
                    </td>
                    <td className="hidden px-3 py-2.5 text-right font-numeric tabular-nums sm:table-cell sm:px-4">
                      {row.durationSec > 0
                        ? formatDuration(row.durationSec)
                        : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
