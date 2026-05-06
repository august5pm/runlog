import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { ensureRollingChallenges } from "@/lib/community-challenges";
import { CommunityPostForm } from "@/components/CommunityPostForm";
import { CommunityPostCard } from "@/components/CommunityPostCard";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function pickParam(
  value: string | string[] | undefined,
): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0];
  return undefined;
}

async function postWhereFromFilter(
  raw: string | undefined,
): Promise<Prisma.CommunityPostWhereInput> {
  if (!raw || raw === "all") return {};
  if (raw === "free") return { challengeId: null };
  const c = await prisma.challenge.findUnique({
    where: { id: raw },
    select: { id: true },
  });
  if (!c) return {};
  return { challengeId: raw };
}

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  await ensureRollingChallenges();
  const session = await getServerSession(authOptions);
  const currentUserId = session?.user?.id ?? null;

  const filterRaw = pickParam(searchParams.challenge);
  const now = new Date();
  const challenges = await prisma.challenge.findMany({
    where: { endsAt: { gte: now } },
    orderBy: { startsAt: "asc" },
    select: { id: true, title: true, slug: true, summary: true, endsAt: true },
  });

  const challengeIds = new Set(challenges.map((c) => c.id));
  const filterRecognized =
    !filterRaw ||
    filterRaw === "all" ||
    filterRaw === "free" ||
    challengeIds.has(filterRaw);
  const filterForQuery =
    !filterRaw || filterRaw === "all" ? undefined : filterRaw;
  const postWhere = filterRecognized
    ? await postWhereFromFilter(filterForQuery)
    : {};

  const posts = await prisma.communityPost.findMany({
    where: postWhere,
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      challenge: {
        select: { id: true, title: true },
      },
      run: {
        select: {
          id: true,
          date: true,
          distanceKm: true,
          durationSec: true,
        },
      },
      user: {
        select: { nickname: true, profileEmoji: true },
      },
      reactions: {
        select: { userId: true, kind: true },
      },
      _count: {
        select: { comments: true },
      },
    },
  });

  function filterHref(next: string | undefined): string {
    if (!next) return "/community";
    if (next === "free") return "/community?challenge=free";
    return `/community?challenge=${next}`;
  }

  const showAllChip =
    !filterRaw || filterRaw === "all" || !filterRecognized;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-h1 font-bold text-foreground">커뮤니티</h1>
        <p className="mt-1 text-caption text-muted">
          챌린지에 맞춰 한 줄 후기를 남기거나, 내 러닝 기록 일부를 함께 올릴 수 있습니다.
        </p>
        <p className="mt-2 text-caption text-subtle">
          피드에는 <strong className="font-medium text-foreground">닉네임</strong>만
          보입니다. 설정에서 닉네임을 정해 두면 표시가 분명해집니다.
        </p>
      </div>

      <CommunityPostForm
        challenges={challenges.map((c) => ({ id: c.id, title: c.title }))}
      />

      <section className="space-y-3">
        <h2 className="text-h2 font-semibold text-foreground">피드</h2>
        <div className="flex flex-wrap gap-1.5">
          <Link
            href="/community"
            scroll={false}
            className={`rounded-full border px-3 py-1.5 text-caption font-semibold transition ${
              showAllChip
                ? "border-accent bg-accent text-accent-foreground"
                : "border-border bg-bg text-muted hover:border-muted hover:text-foreground"
            }`}
          >
            전체
          </Link>
          <Link
            href={filterHref("free")}
            scroll={false}
            className={`rounded-full border px-3 py-1.5 text-caption font-semibold transition ${
              filterRaw === "free"
                ? "border-accent bg-accent text-accent-foreground"
                : "border-border bg-bg text-muted hover:border-muted hover:text-foreground"
            }`}
          >
            자유
          </Link>
          {challenges.map((c) => (
            <Link
              key={c.id}
              href={filterHref(c.id)}
              scroll={false}
              className={`rounded-full border px-3 py-1.5 text-caption font-semibold transition ${
                filterRaw === c.id
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border bg-bg text-muted hover:border-muted hover:text-foreground"
            }`}
            >
              {c.title.replace(" 한 줄 러닝", "")}
            </Link>
          ))}
        </div>

        {posts.length === 0 ? (
          <p className="rounded-card border border-dashed border-border bg-surface p-8 text-center text-caption text-muted">
            아직 글이 없습니다. 첫 한 줄을 남겨 보세요.
          </p>
        ) : (
          <ul className="space-y-3">
            {posts.map((p) => (
              <CommunityPostCard key={p.id} post={p} currentUserId={currentUserId} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
