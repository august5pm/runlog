"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PROFILE_EMOJI_PRESETS } from "@/lib/profile-emoji-presets";
import {
  DEFAULT_PROFILE_EMOJI,
  resolveDisplayName,
  resolveProfileEmoji,
} from "@/lib/user-display";

type Props = {
  nickname: string | null;
  profileEmoji: string | null;
  fallbackName: string | null;
  fallbackEmail: string | null;
  weeklyDistanceGoalKm: number | null;
  monthlyDistanceGoalKm: number | null;
};

function goalInputInitial(n: number | null): string {
  return n != null && n > 0 ? String(n) : "";
}

export function ProfileSettingsForm({
  nickname: initialNickname,
  profileEmoji: initialEmoji,
  fallbackName,
  fallbackEmail,
  weeklyDistanceGoalKm: initialWeekGoal,
  monthlyDistanceGoalKm: initialMonthGoal,
}: Props) {
  const router = useRouter();
  const { update } = useSession();
  const [nickname, setNickname] = useState(initialNickname ?? "");
  const [profileEmoji, setProfileEmoji] = useState(initialEmoji ?? "");
  const [weeklyGoal, setWeeklyGoal] = useState(() =>
    goalInputInitial(initialWeekGoal),
  );
  const [monthlyGoal, setMonthlyGoal] = useState(() =>
    goalInputInitial(initialMonthGoal),
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(
    null,
  );

  const previewUser = {
    nickname: nickname.trim() || null,
    name: fallbackName,
    email: fallbackEmail,
  };
  const previewName = resolveDisplayName(previewUser);
  const previewEmoji = resolveProfileEmoji(profileEmoji.trim() || null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const wTrim = weeklyGoal.trim();
      const mTrim = monthlyGoal.trim();
      let weeklyDistanceGoalKm: number | null = null;
      let monthlyDistanceGoalKm: number | null = null;
      if (wTrim !== "") {
        const w = parseFloat(wTrim.replace(",", "."));
        if (!Number.isFinite(w) || w < 0 || w > 999.99) {
          setMessage({
            type: "err",
            text: "주간 목표는 0~999.99 km 숫자로 입력해 주세요.",
          });
          setSaving(false);
          return;
        }
        weeklyDistanceGoalKm = w === 0 ? null : Math.round(w * 100) / 100;
      }
      if (mTrim !== "") {
        const m = parseFloat(mTrim.replace(",", "."));
        if (!Number.isFinite(m) || m < 0 || m > 999.99) {
          setMessage({
            type: "err",
            text: "월간 목표는 0~999.99 km 숫자로 입력해 주세요.",
          });
          setSaving(false);
          return;
        }
        monthlyDistanceGoalKm = m === 0 ? null : Math.round(m * 100) / 100;
      }

      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname: nickname.trim(),
          profileEmoji: profileEmoji.trim(),
          weeklyDistanceGoalKm:
            wTrim === "" ? null : weeklyDistanceGoalKm,
          monthlyDistanceGoalKm:
            mTrim === "" ? null : monthlyDistanceGoalKm,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setMessage({ type: "err", text: json.error ?? "저장에 실패했습니다." });
        return;
      }
      setMessage({ type: "ok", text: "저장했습니다." });
      await update({
        nickname: nickname.trim() || null,
        profileEmoji: profileEmoji.trim() || null,
      });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-card border border-border bg-surface p-4 shadow-card">
      <h2 className="text-h2 font-semibold text-foreground">프로필</h2>
      <p className="text-caption text-muted">
        닉네임·이모지는 헤더에 표시됩니다. Google 프로필 사진은 사용하지 않습니다.
      </p>

      <div className="flex items-center gap-4 rounded-lg border border-border bg-bg/50 p-3">
        <span
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent-muted text-3xl leading-none"
          aria-hidden
        >
          {previewEmoji}
        </span>
        <div className="min-w-0 text-caption text-muted">
          <p className="font-medium text-foreground">미리보기</p>
          <p className="truncate">{previewName}</p>
        </div>
      </div>

      <div>
        <label htmlFor="nickname" className="mb-1 block text-caption font-medium text-foreground">
          닉네임
        </label>
        <input
          id="nickname"
          name="nickname"
          type="text"
          autoComplete="nickname"
          maxLength={40}
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder={resolveDisplayName({
            nickname: null,
            name: fallbackName,
            email: fallbackEmail,
          })}
          className="w-full rounded-input border border-border bg-bg px-3 py-2 text-body text-foreground shadow-inner outline-none ring-accent focus:ring-2"
        />
        <p className="mt-1 text-caption text-subtle">
          비워 두면 Google 이름 → 이메일 앞부분 순으로 표시됩니다.
        </p>
      </div>

      <div>
        <span className="mb-1 block text-caption font-medium text-foreground">
          프로필 이모지
        </span>
        <p className="mb-2 text-caption text-subtle">
          아래에서 고르거나 직접 입력할 수 있습니다. 비워 두면 기본{" "}
          {DEFAULT_PROFILE_EMOJI} 입니다.
        </p>
        <div
          className="mb-3 grid grid-cols-6 gap-1.5 sm:grid-cols-9"
          role="group"
          aria-label="이모지 샘플"
        >
          {PROFILE_EMOJI_PRESETS.map((emo) => {
            const selected = profileEmoji.trim() === emo;
            return (
              <button
                key={emo}
                type="button"
                onClick={() => setProfileEmoji(emo)}
                aria-pressed={selected}
                title={emo}
                className={`flex aspect-square items-center justify-center rounded-lg border text-xl leading-none transition hover:bg-surface ${
                  selected
                    ? "border-accent bg-accent-muted ring-2 ring-accent"
                    : "border-border bg-bg hover:border-muted"
                }`}
              >
                <span aria-hidden>{emo}</span>
              </button>
            );
          })}
        </div>
        <label htmlFor="profileEmoji" className="sr-only">
          프로필 이모지 직접 입력
        </label>
        <input
          id="profileEmoji"
          name="profileEmoji"
          type="text"
          maxLength={32}
          value={profileEmoji}
          onChange={(e) => setProfileEmoji(e.target.value)}
          placeholder={DEFAULT_PROFILE_EMOJI}
          className="w-full rounded-input border border-border bg-bg px-3 py-2 text-body text-foreground shadow-inner outline-none ring-accent focus:ring-2"
        />
      </div>

      <div className="rounded-lg border border-border bg-bg/50 p-3">
        <h3 className="text-caption font-semibold text-foreground">거리 목표</h3>
        <p className="mt-1 text-caption text-subtle">
          대시보드에서 이번 주·이번 달 달성률로 표시됩니다. 비우면 목표 없음.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label
              htmlFor="weeklyGoal"
              className="mb-1 block text-caption font-medium text-foreground"
            >
              주간 목표 (km)
            </label>
            <input
              id="weeklyGoal"
              name="weeklyGoal"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder="예: 30"
              value={weeklyGoal}
              onChange={(e) => setWeeklyGoal(e.target.value)}
              className="w-full rounded-input border border-border bg-bg px-3 py-2 text-body text-foreground shadow-inner outline-none ring-accent focus:ring-2"
            />
          </div>
          <div>
            <label
              htmlFor="monthlyGoal"
              className="mb-1 block text-caption font-medium text-foreground"
            >
              월간 목표 (km)
            </label>
            <input
              id="monthlyGoal"
              name="monthlyGoal"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder="예: 120"
              value={monthlyGoal}
              onChange={(e) => setMonthlyGoal(e.target.value)}
              className="w-full rounded-input border border-border bg-bg px-3 py-2 text-body text-foreground shadow-inner outline-none ring-accent focus:ring-2"
            />
          </div>
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

      <button
        type="submit"
        disabled={saving}
        className="rounded-button bg-accent px-4 py-2 text-caption font-semibold text-white shadow-card hover:opacity-90 disabled:opacity-50"
      >
        {saving ? "저장 중…" : "저장"}
      </button>
    </form>
  );
}
