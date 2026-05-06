import { ALL_BADGES, badgeMeta, syncUserBadges } from "@/lib/badges";
import { formatDateLabel } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export async function SettingsBadgesSection({ userId }: { userId: string }) {
  await syncUserBadges(userId);
  const earnedRows = await prisma.userBadge.findMany({
    where: { userId },
    orderBy: { earnedAt: "desc" },
  });
  const earnedMap = new Map(earnedRows.map((r) => [r.badgeId, r.earnedAt]));
  const earnedOrdered = earnedRows
    .map((r) => {
      const meta = badgeMeta(r.badgeId);
      if (!meta) return null;
      return { ...meta, earnedAt: r.earnedAt };
    })
    .filter((x): x is NonNullable<typeof x> => x != null);

  const locked = ALL_BADGES.filter((b) => !earnedMap.has(b.id));

  return (
    <section
      className="rounded-card border border-border bg-surface p-4 shadow-card"
      aria-labelledby="badges-heading"
    >
      <h2 id="badges-heading" className="text-h2 font-semibold text-foreground">
        배지
      </h2>
      <p className="mt-1 text-caption text-muted">
        조건을 달성하면 배지가 저장돼요. 푸시 알림은 없으며, 여기서만 모아 볼 수 있어요.
      </p>

      {earnedOrdered.length === 0 ? (
        <p className="mt-4 text-caption text-subtle">
          아직 획득한 배지가 없어요. 러닝을 기록해 보세요.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {earnedOrdered.map((b) => (
            <li
              key={b.id}
              className="flex gap-3 rounded-lg border border-border bg-bg/60 px-3 py-2.5"
            >
              <span className="text-2xl leading-none" aria-hidden>
                {b.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground">{b.title}</p>
                <p className="mt-0.5 text-caption text-muted">{b.description}</p>
                <p className="mt-1 text-[11px] text-subtle">
                  획득 {formatDateLabel(b.earnedAt)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {locked.length > 0 ? (
        <div className="mt-6 border-t border-border pt-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-subtle">
            아직 획득 전
          </p>
          <ul className="mt-2 space-y-2">
            {locked.map((b) => (
              <li
                key={b.id}
                className="flex gap-2 rounded-lg border border-dashed border-border px-2.5 py-2 text-caption text-subtle"
              >
                <span aria-hidden>{b.emoji}</span>
                <div>
                  <span className="font-medium text-muted">{b.title}</span>
                  <span className="mx-1 text-subtle">·</span>
                  <span>{b.hint}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
