import { getServerSession } from "next-auth";
import { ensureRollingChallenges } from "@/lib/community-challenges";
import { CommunityPostForm } from "@/components/CommunityPostForm";
import { CommunityPostCard } from "@/components/CommunityPostCard";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function CommunityPage() {
  await ensureRollingChallenges();

  const now = new Date();
  const [session, challenges, posts] = await Promise.all([
    getServerSession(authOptions),
    prisma.challenge.findMany({
      where: { endsAt: { gte: now } },
      orderBy: { startsAt: "asc" },
      select: { id: true, title: true, slug: true, summary: true, endsAt: true },
    }),
    prisma.communityPost.findMany({
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
    }),
  ]);

  const currentUserId = session?.user?.id ?? null;

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
