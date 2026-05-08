"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { RunLogLogo } from "@/components/RunLogLogo";
import { getAuthErrorMessage } from "@/lib/auth-errors";

export function Landing({
  googleOAuthReady,
  oauthErrorFromUrl,
}: {
  googleOAuthReady: boolean;
  oauthErrorFromUrl?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const urlErrorText = oauthErrorFromUrl
    ? getAuthErrorMessage(oauthErrorFromUrl)
    : null;

  async function handleGoogleSignIn() {
    setLocalError(null);
    setBusy(true);
    try {
      // OAuth는 기본 redirect:true 로 두는 편이 안정적(로그아웃 직후 redirect:false 조합에서 url 미수신 이슈 방지)
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch (e) {
      console.error(e);
      setLocalError(
        "요청 중 예외가 발생했습니다. 주소가 http://localhost:3000 과 동일한지(127.0.0.1 혼용 없이) 확인해 보세요.",
      );
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-6 flex flex-col items-center gap-3">
          <span aria-hidden className="flex">
            <RunLogLogo size={56} priority className="rounded-lg" />
          </span>
          <p className="text-caption font-semibold uppercase tracking-wide text-accent">
            RunLog
          </p>
        </div>
        <h1 className="mb-4 text-display font-bold leading-tight text-foreground">
          오늘 러닝, 가볍게 기록
        </h1>
        <p className="mb-10 text-muted leading-relaxed">
          거리·시간·메모와 주간 차트를 한곳에서.
          <br />
          Google 계정으로 시작하세요.
        </p>

        {!googleOAuthReady ? (
          <div
            className="mb-6 rounded-card border border-amber-200 bg-amber-50 p-4 text-left text-caption text-amber-950"
            role="status"
          >
            <p className="font-semibold">Google 로그인을 쓰려면 환경 변수가 필요합니다.</p>
            <p className="mt-2 text-amber-900/90">
              프로젝트 루트에 <code className="rounded bg-amber-100/80 px-1">.env</code> 파일을
              만들고 <code className="rounded bg-amber-100/80 px-1">.env.example</code>을
              참고해 <code className="rounded bg-amber-100/80 px-1">GOOGLE_CLIENT_ID</code>,{" "}
              <code className="rounded bg-amber-100/80 px-1">GOOGLE_CLIENT_SECRET</code>,{" "}
              <code className="rounded bg-amber-100/80 px-1">NEXTAUTH_SECRET</code>,{" "}
              <code className="rounded bg-amber-100/80 px-1">NEXTAUTH_URL</code>을 채운 뒤{" "}
              <code className="rounded bg-amber-100/80 px-1">npm run dev</code>를 다시
              실행하세요.
            </p>
          </div>
        ) : null}

        {localError || urlErrorText ? (
          <div
            className="mb-4 rounded-card border border-red-300 bg-danger-muted p-4 text-left text-caption text-foreground"
            role="alert"
          >
            {localError ?? urlErrorText}
          </div>
        ) : null}

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={busy || !googleOAuthReady}
          className="w-full rounded-button bg-accent px-5 py-3.5 text-body font-semibold text-accent-foreground shadow-card transition hover:bg-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "이동 중…" : "Google로 계속하기"}
        </button>
      </div>
    </div>
  );
}
