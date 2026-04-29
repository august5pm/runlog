"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={async () => {
        await signOut({ redirect: false });
        // 전체 새로고침: 클라이언트 세션·CSRF 쿠키 정리 후 로그인 버튼이 안정적으로 동작
        window.location.assign("/");
      }}
      className="rounded-button border border-border bg-surface px-4 py-2.5 text-caption font-semibold text-foreground hover:bg-accent-muted"
    >
      로그아웃
    </button>
  );
}
