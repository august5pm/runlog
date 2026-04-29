import Link from "next/link";
import { getAuthErrorMessage } from "@/lib/auth-errors";

function pickParam(v: string | string[] | undefined): string | undefined {
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v[0];
  return undefined;
}

export default function AuthErrorPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const code = pickParam(searchParams.error);
  const message = getAuthErrorMessage(code);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-bg px-6 text-foreground">
      <div className="mx-auto max-w-md rounded-card border border-border bg-surface p-8 shadow-card">
        <h1 className="text-h1 font-bold text-foreground">로그인할 수 없습니다</h1>
        <p className="mt-4 text-body leading-relaxed text-muted">{message}</p>
        {code ? (
          <p className="mt-2 font-mono text-caption text-subtle">코드: {code}</p>
        ) : null}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/"
            className="rounded-button bg-accent px-4 py-3 text-center text-caption font-semibold text-accent-foreground hover:bg-accent-hover"
          >
            처음으로
          </Link>
          <Link
            href="/"
            className="rounded-button border border-border px-4 py-3 text-center text-caption font-semibold text-foreground hover:bg-accent-muted"
          >
            다시 로그인
          </Link>
        </div>
      </div>
    </div>
  );
}
