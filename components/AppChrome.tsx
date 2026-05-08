"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Session } from "next-auth";
import { signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { RunLogLogo } from "@/components/RunLogLogo";
import {
  DEFAULT_DISPLAY_NAME,
  resolveDisplayName,
  resolveProfileEmoji,
} from "@/lib/user-display";

const nav = [
  { href: "/dashboard", label: "대시보드" },
  { href: "/ranking", label: "랭킹" },
  { href: "/community", label: "커뮤니티" },
  { href: "/runs", label: "기록" },
] as const;

function userLabel(session: Session): string {
  if (!session.user) return DEFAULT_DISPLAY_NAME;
  return resolveDisplayName(session.user);
}

function userAvatarEmoji(session: Session): string {
  return resolveProfileEmoji(session.user?.profileEmoji);
}

function AccountMenu({ session }: { session: Session }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div
      ref={containerRef}
      className="relative md:ml-1 md:border-l md:border-border md:pl-5"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex max-w-[220px] items-center gap-2 rounded-full border border-border bg-bg px-2.5 py-1 pr-3 text-left shadow-card transition hover:border-accent hover:bg-accent-muted/30"
        aria-label="계정 메뉴 열기"
      >
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-muted text-[1.1rem] leading-none"
          aria-hidden
        >
          {userAvatarEmoji(session)}
        </span>
        <span className="min-w-0">
          <span className="block text-[10px] font-medium uppercase tracking-wide text-subtle">
            로그인
          </span>
          <span className="block truncate text-caption font-medium text-foreground">
            {userLabel(session)}
          </span>
        </span>
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-20 mt-2 min-w-[11rem] rounded-card border border-border bg-surface py-1 shadow-card"
        >
          <Link
            role="menuitem"
            href="/settings"
            className="block px-4 py-2 text-caption text-foreground hover:bg-accent-muted"
            onClick={() => setOpen(false)}
          >
            설정
          </Link>
          <button
            role="menuitem"
            type="button"
            className="w-full px-4 py-2 text-left text-caption text-foreground hover:bg-accent-muted"
            onClick={async () => {
              setOpen(false);
              await signOut({ redirect: false });
              window.location.assign("/");
            }}
          >
            로그아웃
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function AppChrome({
  session,
  children,
}: {
  session: Session;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-dvh flex-col pb-20 md:pb-0">
      <header className="sticky top-0 z-10 border-b border-border bg-surface backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4">
          <Link
            href="/dashboard"
            className="flex min-w-0 items-center gap-2 text-h2 font-bold text-accent"
            aria-label="RunLog 홈"
          >
            <span className="flex shrink-0" aria-hidden>
              <RunLogLogo size={30} className="rounded-lg" />
            </span>
            <span className="truncate">RunLog</span>
          </Link>
          <div className="flex shrink-0 items-center gap-4 md:gap-6">
            <nav className="hidden items-center gap-6 md:flex" aria-label="주요 메뉴">
              {nav.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={
                    pathname === href || pathname.startsWith(href + "/")
                      ? "text-body font-semibold text-foreground"
                      : "text-body text-muted hover:text-foreground"
                  }
                >
                  {label}
                </Link>
              ))}
            </nav>
            <AccountMenu session={session} />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 z-10 flex border-t border-border bg-surface backdrop-blur md:hidden">
        {nav.map(({ href, label }) => {
          const active =
            pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center py-3 text-caption ${
                active
                  ? "font-semibold text-accent"
                  : "font-medium text-muted"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
