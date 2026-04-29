import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { RunForm } from "@/components/RunForm";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Props = { params: { id: string } };

export default async function EditRunPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  const run = await prisma.run.findFirst({
    where: { id: params.id, userId: session!.user!.id },
  });
  if (!run) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/runs"
          className="text-caption font-semibold text-muted hover:text-foreground"
        >
          ← 목록
        </Link>
        <h1 className="text-h1 font-bold text-foreground">기록 수정</h1>
      </div>
      <RunForm
        mode="edit"
        initial={{
          id: run.id,
          date: run.date,
          distanceKm: Number(run.distanceKm),
          durationSec: run.durationSec,
          avgHeartRate: run.avgHeartRate,
          cadence: run.cadence,
          notes: run.notes,
        }}
      />
    </div>
  );
}
