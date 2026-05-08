"use client";

import { useEffect, useState } from "react";
import {
  COMMUNITY_REACTION_PRESETS,
  type CommunityReactionKind,
  emptyReactionCounts,
  isCommunityReactionKind,
} from "@/lib/community-reactions";
import { formatDateLabel } from "@/lib/format";

export type CommunityFeedComment = {
  id: string;
  content: string;
  createdAt: string;
  authorName: string;
  authorEmoji: string;
};

type Props = {
  postId: string;
  currentUserId: string | null;
  initialCommentCount: number;
  initialReactionCounts: Record<CommunityReactionKind, number>;
  initialMyReactionKind: CommunityReactionKind | null;
};

const COMMENT_MAX = 200;

function mergeReactionCounts(
  raw: Record<string, number> | undefined,
): Record<CommunityReactionKind, number> {
  const base = emptyReactionCounts();
  if (!raw) return base;
  for (const k of Object.keys(raw)) {
    if (isCommunityReactionKind(k)) {
      base[k] = Number(raw[k]) || 0;
    }
  }
  return base;
}

export function CommunityPostInteractions({
  postId,
  currentUserId,
  initialCommentCount,
  initialReactionCounts,
  initialMyReactionKind,
}: Props) {
  const [comments, setComments] = useState<CommunityFeedComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentsError, setCommentsError] = useState(false);

  const [commentText, setCommentText] = useState("");
  const [commentBusy, setCommentBusy] = useState(false);
  const [commentMsg, setCommentMsg] = useState<string | null>(null);
  const [reactionBusy, setReactionBusy] = useState(false);

  const [reactionCounts, setReactionCounts] = useState(initialReactionCounts);
  const [myReactionKind, setMyReactionKind] = useState(initialMyReactionKind);
  const [commentCount, setCommentCount] = useState(initialCommentCount);

  useEffect(() => {
    let cancelled = false;
    setCommentsLoading(true);
    setCommentsError(false);
    (async () => {
      try {
        const res = await fetch(`/api/community/posts/${postId}/comments`);
        if (!res.ok) {
          if (!cancelled) setCommentsError(true);
          return;
        }
        const data = (await res.json()) as {
          comments?: CommunityFeedComment[];
          total?: number;
        };
        if (cancelled) return;
        const list = data.comments ?? [];
        setComments(list);
        setCommentCount(
          typeof data.total === "number" ? data.total : list.length,
        );
      } catch {
        if (!cancelled) setCommentsError(true);
      } finally {
        if (!cancelled) setCommentsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [postId]);

  async function onReaction(kind: CommunityReactionKind) {
    if (!currentUserId || reactionBusy) return;
    setReactionBusy(true);
    setCommentMsg(null);
    try {
      const res = await fetch(`/api/community/posts/${postId}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        reactionCounts?: Record<string, number>;
        myReactionKind?: string | null;
      };
      if (!res.ok) {
        setCommentMsg(json.error ?? "반응을 저장하지 못했습니다.");
        return;
      }
      if (json.reactionCounts) {
        setReactionCounts(mergeReactionCounts(json.reactionCounts));
      }
      const mine = json.myReactionKind;
      setMyReactionKind(
        mine && isCommunityReactionKind(mine) ? mine : null,
      );
    } finally {
      setReactionBusy(false);
    }
  }

  async function onCommentSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUserId || commentBusy) return;
    const text = commentText.trim().slice(0, COMMENT_MAX);
    if (!text) return;
    setCommentBusy(true);
    setCommentMsg(null);
    try {
      const res = await fetch(`/api/community/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        comment?: CommunityFeedComment;
      };
      if (!res.ok) {
        setCommentMsg(json.error ?? "댓글을 등록하지 못했습니다.");
        return;
      }
      setCommentText("");
      if (json.comment) {
        setComments((prev) => [...prev, json.comment!]);
        setCommentCount((c) => c + 1);
      }
    } finally {
      setCommentBusy(false);
    }
  }

  return (
    <div className="mt-3 space-y-3 border-t border-border pt-3">
      <div>
        <p className="mb-1.5 text-[11px] font-medium text-subtle">반응</p>
        <div className="flex flex-wrap gap-1.5">
          {COMMUNITY_REACTION_PRESETS.map((p) => {
            const count = reactionCounts[p.kind] ?? 0;
            const active = myReactionKind === p.kind;
            return (
              <button
                key={p.kind}
                type="button"
                disabled={!currentUserId || reactionBusy}
                title={p.label}
                onClick={() => onReaction(p.kind)}
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-caption transition ${
                  active
                    ? "border-accent bg-accent-muted font-semibold text-foreground"
                    : "border-border bg-bg text-muted hover:border-muted hover:text-foreground"
                } disabled:cursor-not-allowed disabled:opacity-50`}
                aria-pressed={active}
              >
                <span aria-hidden>{p.emoji}</span>
                {count > 0 ? (
                  <span className="font-numeric tabular-nums">{count}</span>
                ) : null}
              </button>
            );
          })}
        </div>
        {!currentUserId ? (
          <p className="mt-1.5 text-[11px] text-subtle">로그인하면 반응을 남길 수 있습니다.</p>
        ) : null}
      </div>

      <div>
        <p className="mb-1.5 text-[11px] font-medium text-subtle">
          댓글 {commentCount > 0 ? `(${commentCount})` : ""}
        </p>
        {commentsLoading ? (
          <p className="mb-3 text-caption text-subtle">댓글 불러오는 중…</p>
        ) : commentsError ? (
          <p className="mb-3 text-caption text-red-600">댓글을 불러오지 못했습니다.</p>
        ) : comments.length > 0 ? (
          <ul className="mb-3 max-h-48 space-y-2 overflow-y-auto rounded-lg border border-border bg-bg/60 px-2 py-2">
            {comments.map((c) => (
              <li key={c.id} className="flex gap-2 text-caption">
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-muted text-base leading-none"
                  aria-hidden
                >
                  {c.authorEmoji}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0">
                    <span className="font-semibold text-foreground">{c.authorName}</span>
                    <time className="text-[10px] text-subtle" dateTime={c.createdAt}>
                      {formatDateLabel(new Date(c.createdAt))}
                    </time>
                  </div>
                  <p className="mt-0.5 whitespace-pre-wrap text-muted">{c.content}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mb-3 text-caption text-subtle">첫 댓글을 남겨 보세요.</p>
        )}

        {currentUserId ? (
          <form onSubmit={onCommentSubmit} className="space-y-2">
            <label htmlFor={`comment-${postId}`} className="sr-only">
              댓글 입력
            </label>
            <textarea
              id={`comment-${postId}`}
              rows={2}
              maxLength={COMMENT_MAX}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="댓글을 입력…"
              className="w-full resize-y rounded-input border border-border bg-bg px-2.5 py-1.5 text-caption text-foreground shadow-inner outline-none ring-accent focus:ring-2"
            />
            <div className="flex flex-wrap items-center justify-end gap-2">
              <span className="text-[11px] text-subtle tabular-nums">
                {commentText.trim().length}/{COMMENT_MAX}
              </span>
              <button
                type="submit"
                disabled={commentBusy || commentText.trim().length === 0}
                className="shrink-0 rounded-button bg-accent px-4 py-2 text-caption font-semibold text-white shadow-card hover:opacity-90 disabled:opacity-50"
              >
                {commentBusy ? "등록 중…" : "댓글 등록"}
              </button>
            </div>
          </form>
        ) : (
          <p className="text-[11px] text-subtle">로그인하면 댓글을 남길 수 있습니다.</p>
        )}
        {commentMsg ? (
          <p className="mt-2 text-caption text-red-600" role="status">
            {commentMsg}
          </p>
        ) : null}
      </div>
    </div>
  );
}
