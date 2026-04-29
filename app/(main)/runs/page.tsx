import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  formatDateLabel,
  formatDuration,
  formatHeartCadenceLine,
  formatPaceMinPerKm,
} from "@/lib/format";
import { prisma } from "@/lib/prisma";

export default async function RunsPage() {
  const session = await getServerSession(authOptions);
  const runs = await prisma.run.findMany({
    where: { userId: session!.user!.id },
    orderBy: { date: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-h1 font-bold text-foreground">기록</h1>
        <Link
          href="/runs/new"
          className="rounded-button bg-accent px-4 py-2.5 text-caption font-semibold text-accent-foreground hover:bg-accent-hover"
        >
          추가
        </Link>
      </div>

      {runs.length === 0 ? (
        <p className="rounded-card border border-dashed border-border bg-surface p-8 text-center text-muted">
          아직 기록이 없습니다. 첫 러닝을 남겨 보세요.
        </p>
      ) : (
        <ul className="space-y-3">
          {runs.map((r) => {
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
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-foreground">
                      {formatDateLabel(r.date)}
                    </p>
                    <p className="mt-1 font-numeric text-caption text-muted">
                      {Number(r.distanceKm)} km · {formatDuration(r.durationSec)}{" "}
                      · 페이스{" "}
                      {formatPaceMinPerKm(
                        r.durationSec,
                        Number(r.distanceKm),
                      )}
                      /km
                    </p>
                    {heartCadence ? (
                      <p className="mt-1 font-numeric text-caption text-muted">
                        {heartCadence}
                      </p>
                    ) : null}
                  </div>
                </div>
                {r.notes ? (
                  <p className="mt-2 text-body text-muted">{r.notes}</p>
                ) : null}
              </Link>
            </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
