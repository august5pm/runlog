import {
  communityDisplayName,
  communityProfileEmoji,
} from "@/lib/community-display";
import {
  aggregateReactionCounts,
  isCommunityReactionKind,
} from "@/lib/community-reactions";
import { formatDateLabel, formatDuration } from "@/lib/format";
import { CommunityPostInteractions } from "@/components/CommunityPostInteractions";

type RunSnippet = {
  id: string;
  date: Date;
  distanceKm: unknown;
  durationSec: number;
} | null;

type PostForCard = {
  id: string;
  createdAt: Date;
  content: string;
  challenge: { id: string; title: string } | null;
  run: RunSnippet;
  user: { nickname: string | null; profileEmoji: string | null };
  _count: { comments: number };
  reactions: Array<{ userId: string; kind: string }>;
};

export function CommunityPostCard({
  post,
  currentUserId,
}: {
  post: PostForCard;
  currentUserId: string | null;
}) {
  const name = communityDisplayName(post.user.nickname);
  const emoji = communityProfileEmoji(post.user.profileEmoji);
  const reactionCounts = aggregateReactionCounts(post.reactions);
  const rawMy = currentUserId
    ? post.reactions.find((r) => r.userId === currentUserId)?.kind ?? null
    : null;
  const myReactionKind = rawMy && isCommunityReactionKind(rawMy) ? rawMy : null;

  return (
    <li className="rounded-card border border-border bg-surface p-4 shadow-card">
      <div className="flex gap-3">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-muted text-xl leading-none"
          aria-hidden
        >
          {emoji}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="font-semibold text-foreground">{name}</span>
            <time className="text-caption text-subtle" dateTime={post.createdAt.toISOString()}>
              {formatDateLabel(post.createdAt)}
            </time>
          </div>
          {post.challenge ? (
            <p className="mt-0.5 text-[11px] font-medium text-accent">{post.challenge.title}</p>
          ) : (
            <p className="mt-0.5 text-[11px] text-muted">자유</p>
          )}
          <p className="mt-2 whitespace-pre-wrap text-body text-foreground">{post.content}</p>
          {post.run ? (
            <p className="mt-2 rounded-lg border border-border bg-bg/80 px-2.5 py-1.5 font-numeric text-caption text-muted">
              공유한 기록 · {Number(post.run.distanceKm)} km ·{" "}
              {formatDuration(post.run.durationSec)} · {formatDateLabel(post.run.date)}
            </p>
          ) : null}
          <CommunityPostInteractions
            postId={post.id}
            currentUserId={currentUserId}
            initialCommentCount={post._count.comments}
            initialReactionCounts={reactionCounts}
            initialMyReactionKind={myReactionKind}
          />
        </div>
      </div>
    </li>
  );
}
