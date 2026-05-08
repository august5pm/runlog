"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type ChallengeOption = { id: string; title: string };

type RunOption = {
  id: string;
  date: string;
  distanceKm: number;
};

const CONTENT_MAX = 280;

export function CommunityPostForm({
  challenges,
}: {
  challenges: ChallengeOption[];
}) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [challengeId, setChallengeId] = useState<string>("");
  const [runId, setRunId] = useState<string>("");
  const [runs, setRuns] = useState<RunOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/runs?limit=25");
        if (!res.ok) return;
        const data = (await res.json()) as {
          id: string;
          date: string;
          distanceKm: unknown;
        }[];
        if (cancelled) return;
        setRuns(
          data.map((r) => ({
            id: r.id,
            date: r.date,
            distanceKm: Number(r.distanceKm),
          })),
        );
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/community/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          challengeId: challengeId || null,
          runId: runId || null,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setMessage({ type: "err", text: json.error ?? "등록에 실패했습니다." });
        return;
      }
      setContent("");
      setChallengeId("");
      setRunId("");
      setMessage({ type: "ok", text: "올렸습니다." });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-3 rounded-card border border-border bg-surface p-4 shadow-card"
    >
      <h2 className="text-h2 font-semibold text-foreground">한 줄 올리기</h2>
      <div>
        <label htmlFor="comm-content" className="sr-only">
          한 줄 후기
        </label>
        <textarea
          id="comm-content"
          name="content"
          rows={2}
          maxLength={CONTENT_MAX}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="오늘 러닝 한 줄 후기…"
          className="w-full resize-y rounded-input border border-border bg-bg px-3 py-2 text-body text-foreground shadow-inner outline-none ring-accent focus:ring-2"
        />
        <p className="mt-1 text-right text-caption text-subtle">
          {content.trim().length}/{CONTENT_MAX}
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label
            htmlFor="comm-challenge"
            className="mb-1 block text-caption font-medium text-foreground"
          >
            챌린지 (선택)
          </label>
          <select
            id="comm-challenge"
            value={challengeId}
            onChange={(e) => setChallengeId(e.target.value)}
            className="select-chevron-inset w-full rounded-input border border-border bg-bg text-caption text-foreground shadow-inner outline-none ring-accent focus:ring-2"
          >
            <option value="">자유 (챌린지 없음)</option>
            {challenges.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="comm-run"
            className="mb-1 block text-caption font-medium text-foreground"
          >
            기록 첨부 (선택)
          </label>
          <select
            id="comm-run"
            value={runId}
            onChange={(e) => setRunId(e.target.value)}
            className="select-chevron-inset w-full rounded-input border border-border bg-bg text-caption text-foreground shadow-inner outline-none ring-accent focus:ring-2"
          >
            <option value="">첨부 안 함</option>
            {runs.map((r) => (
              <option key={r.id} value={r.id}>
                {Number(r.distanceKm)} km ·{" "}
                {new Date(r.date).toLocaleDateString("ko-KR", {
                  month: "short",
                  day: "numeric",
                })}
              </option>
            ))}
          </select>
        </div>
      </div>
      {message ? (
        <p
          className={
            message.type === "ok" ? "text-caption text-accent" : "text-caption text-red-600"
          }
          role="status"
        >
          {message.text}
        </p>
      ) : null}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving || content.trim().length === 0}
          className="rounded-button bg-accent px-4 py-2 text-caption font-semibold text-white shadow-card hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "등록 중…" : "등록"}
        </button>
      </div>
    </form>
  );
}
