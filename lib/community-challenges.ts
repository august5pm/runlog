import { prisma } from "@/lib/prisma";
import { monthRange, weekRange } from "@/lib/week";

function weekSlug(start: Date): string {
  const y = start.getFullYear();
  const m = String(start.getMonth() + 1).padStart(2, "0");
  const d = String(start.getDate()).padStart(2, "0");
  return `week-${y}${m}${d}`;
}

function monthSlug(start: Date): string {
  const y = start.getFullYear();
  const m = String(start.getMonth() + 1).padStart(2, "0");
  return `month-${y}${m}`;
}

/** 이번 주·이번 달 챌린지 행이 없으면 생성 (페이지 진입 시 idempotent) */
export async function ensureRollingChallenges(anchor = new Date()): Promise<void> {
  const wr = weekRange(anchor);
  const mr = monthRange(anchor);
  const ws = weekSlug(wr.start);
  const ms = monthSlug(mr.start);

  await prisma.challenge.upsert({
    where: { slug: ws },
    create: {
      slug: ws,
      title: "이번 주 한 줄 러닝",
      summary: "이번 주에 뛴 이야기를 남겨 보세요.",
      startsAt: wr.start,
      endsAt: wr.end,
    },
    update: {},
  });

  await prisma.challenge.upsert({
    where: { slug: ms },
    create: {
      slug: ms,
      title: "이번 달 한 줄 러닝",
      summary: "이번 달 목표와 소감을 공유해 보세요.",
      startsAt: mr.start,
      endsAt: mr.end,
    },
    update: {},
  });
}
