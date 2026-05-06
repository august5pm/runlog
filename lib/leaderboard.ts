import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { RunPeriodRange } from "@/lib/run-period";
import { runDateFilterForPeriod } from "@/lib/run-period";
import { resolveDisplayName, resolveProfileEmoji } from "@/lib/user-display";

export type LeaderboardMetric = "distance" | "runs";

export type LeaderboardRow = {
  rank: number;
  userId: string;
  km: number;
  runs: number;
  durationSec: number;
  displayName: string;
  emoji: string;
};

const TOP_LIMIT = 50;

type Agg = {
  userId: string;
  km: number;
  runs: number;
  durationSec: number;
};

function assignRanks(
  rows: Agg[],
  metric: LeaderboardMetric,
): Map<string, number> {
  const rankByUser = new Map<string, number>();
  let currentRank = 0;
  let prevPrimary: number | null = null;
  let pos = 0;
  for (const row of rows) {
    pos++;
    const primary = metric === "distance" ? row.km : row.runs;
    if (prevPrimary === null || primary !== prevPrimary) {
      currentRank = pos;
      prevPrimary = primary;
    }
    rankByUser.set(row.userId, currentRank);
  }
  return rankByUser;
}

export async function getLeaderboard(
  period: RunPeriodRange,
  metric: LeaderboardMetric,
  currentUserId: string,
): Promise<{
  top: LeaderboardRow[];
  me: LeaderboardRow | null;
  totalParticipants: number;
}> {
  const dateFilter = runDateFilterForPeriod(period);
  const where: Prisma.RunWhereInput = dateFilter ? { date: dateFilter } : {};

  const grouped = await prisma.run.groupBy({
    by: ["userId"],
    where,
    _sum: { distanceKm: true, durationSec: true },
    _count: { id: true },
  });

  const aggs: Agg[] = grouped.map((g) => ({
    userId: g.userId,
    km: Number(g._sum.distanceKm ?? 0),
    runs: g._count.id,
    durationSec: g._sum.durationSec ?? 0,
  }));

  aggs.sort((a, b) => {
    if (metric === "distance") {
      if (b.km !== a.km) return b.km - a.km;
      if (b.runs !== a.runs) return b.runs - a.runs;
      return a.userId.localeCompare(b.userId);
    }
    if (b.runs !== a.runs) return b.runs - a.runs;
    if (b.km !== a.km) return b.km - a.km;
    return a.userId.localeCompare(b.userId);
  });

  const rankByUser = assignRanks(aggs, metric);

  const neededIds = Array.from(
    new Set([
      ...aggs.slice(0, TOP_LIMIT).map((a) => a.userId),
      currentUserId,
    ]),
  );

  const users = await prisma.user.findMany({
    where: { id: { in: neededIds } },
    select: {
      id: true,
      nickname: true,
      profileEmoji: true,
      name: true,
      email: true,
    },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));

  function toRow(agg: Agg): LeaderboardRow {
    const u = userMap.get(agg.userId);
    return {
      rank: rankByUser.get(agg.userId) ?? 0,
      userId: agg.userId,
      km: agg.km,
      runs: agg.runs,
      durationSec: agg.durationSec,
      displayName: u
        ? resolveDisplayName(u)
        : "알 수 없음",
      emoji: u ? resolveProfileEmoji(u.profileEmoji) : "🏃",
    };
  }

  const top = aggs.slice(0, TOP_LIMIT).map(toRow);
  const myAgg = aggs.find((a) => a.userId === currentUserId);
  const me = myAgg ? toRow(myAgg) : null;

  return {
    top,
    me,
    totalParticipants: aggs.length,
  };
}
