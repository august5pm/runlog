"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Session } from "next-auth";

const nav = [
  { href: "/dashboard", label: "대시보드" },
  { href: "/runs", label: "기록" },
  { href: "/settings", label: "설정" },
] as const;

function userInitial(session: Session): string {
  const name = session.user?.name?.trim();
  if (name) return name.slice(0, 1).toUpperCase();
  const email = session.user?.email;
  if (email) return email.slice(0, 1).toUpperCase();
  return "?";
}

function userLabel(session: Session): string {
  return session.user?.name?.trim() || session.user?.email || "사용자";
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
      <header className="sticky top-0 z-10 hidden border-b border-border bg-surface backdrop-blur md:block">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link
            href="/dashboard"
            className="text-h2 font-bold text-accent"
          >
            RunLog
          </Link>
          <nav className="flex items-center gap-6">
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
            <div
              className="ml-1 flex items-center border-l border-border pl-5"
              aria-label="로그인 계정"
            >
              <span className="inline-flex max-w-[220px] items-center gap-2 rounded-full border border-border bg-bg px-2.5 py-1 pr-3 shadow-card">
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-muted text-caption font-bold text-accent"
                  aria-hidden
                >
                  {userInitial(session)}
                </span>
                <span className="min-w-0">
                  <span className="block text-[10px] font-medium uppercase tracking-wide text-subtle">
                    로그인
                  </span>
                  <span className="block truncate text-caption font-medium text-foreground">
                    {userLabel(session)}
                  </span>
                </span>
              </span>
            </div>
          </nav>
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
