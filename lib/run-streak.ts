import { prisma } from "@/lib/prisma";

function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDaysToKey(key: string, deltaDays: number): string {
  const [y, mo, da] = key.split("-").map(Number);
  const d = new Date(y, mo - 1, da + deltaDays);
  return localDateKey(d);
}

/**
 * 로컬 달력 기준 연속 기록 일수.
 * 오늘 또는 어제 중 하루라도 뛰지 않았으면 0.
 * 그 외에는 어제(또는 오늘)부터 하루씩 거슬러 올라가며 이어진 일수.
 */
export async function getRunningStreakDays(userId: string): Promise<number> {
  const runs = await prisma.run.findMany({
    where: { userId },
    select: { date: true },
  });
  const daySet = new Set(runs.map((r) => localDateKey(new Date(r.date))));
  if (daySet.size === 0) return 0;

  const today = localDateKey(new Date());
  let cursor = today;
  if (!daySet.has(cursor)) {
    cursor = addDaysToKey(today, -1);
    if (!daySet.has(cursor)) {
      return 0;
    }
  }

  let streak = 0;
  while (daySet.has(cursor)) {
    streak++;
    cursor = addDaysToKey(cursor, -1);
  }
  return streak;
}
