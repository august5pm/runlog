import { prisma } from "@/lib/prisma";
import { getRunningStreakDays } from "@/lib/run-streak";
import { monthRange, weekRange } from "@/lib/week";

export const ALL_BADGES = [
  {
    id: "first_run",
    emoji: "🎽",
    title: "첫 러닝",
    description: "첫 러닝 기록을 남겼어요.",
    hint: "기록 1회 이상",
  },
  {
    id: "week_3",
    emoji: "🎯",
    title: "이번 주 3회",
    description: "이번 주에 러닝을 3번 기록했어요.",
    hint: "이번 주(월~일) 기록 3회 이상",
  },
  {
    id: "week_5",
    emoji: "🔥",
    title: "이번 주 5회",
    description: "이번 주에 러닝을 5번 기록했어요.",
    hint: "이번 주 기록 5회 이상",
  },
  {
    id: "month_10",
    emoji: "🏅",
    title: "이번 달 10회",
    description: "이번 달에 러닝을 10번 기록했어요.",
    hint: "이번 달 기록 10회 이상",
  },
  {
    id: "streak_7",
    emoji: "✨",
    title: "연속 7일",
    description: "연속으로 7일간 기록했어요.",
    hint: "연속 기록 7일 이상",
  },
  {
    id: "streak_14",
    emoji: "🏆",
    title: "연속 14일",
    description: "연속으로 14일간 기록했어요.",
    hint: "연속 기록 14일 이상",
  },
] as const;

export type BadgeId = (typeof ALL_BADGES)[number]["id"];

const BADGE_ID_SET = new Set<string>(ALL_BADGES.map((b) => b.id));

export function badgeMeta(id: string): (typeof ALL_BADGES)[number] | undefined {
  return ALL_BADGES.find((b) => b.id === id);
}

async function computeEligibleBadgeIds(userId: string): Promise<Set<BadgeId>> {
  const anchor = new Date();
  const wr = weekRange(anchor);
  const mr = monthRange(anchor);

  const [totalRuns, weekCount, monthCount, streak] = await Promise.all([
    prisma.run.count({ where: { userId } }),
    prisma.run.count({
      where: {
        userId,
        date: { gte: wr.start, lt: wr.end },
      },
    }),
    prisma.run.count({
      where: {
        userId,
        date: { gte: mr.start, lt: mr.end },
      },
    }),
    getRunningStreakDays(userId),
  ]);

  const eligible = new Set<BadgeId>();
  if (totalRuns >= 1) eligible.add("first_run");
  if (weekCount >= 3) eligible.add("week_3");
  if (weekCount >= 5) eligible.add("week_5");
  if (monthCount >= 10) eligible.add("month_10");
  if (streak >= 7) eligible.add("streak_7");
  if (streak >= 14) eligible.add("streak_14");
  return eligible;
}

/** 조건을 만족하는 배지를 DB에 추가(이미 있으면 유지). */
export async function syncUserBadges(userId: string): Promise<void> {
  const eligible = await computeEligibleBadgeIds(userId);
  const filtered = Array.from(eligible).filter((id) => BADGE_ID_SET.has(id));
  if (filtered.length === 0) return;

  const existing = await prisma.userBadge.findMany({
    where: { userId },
    select: { badgeId: true },
  });
  const have = new Set(existing.map((e) => e.badgeId));
  const toAdd = filtered.filter((id) => !have.has(id));
  if (toAdd.length === 0) return;

  await prisma.userBadge.createMany({
    data: toAdd.map((badgeId) => ({ userId, badgeId })),
    skipDuplicates: true,
  });
}
