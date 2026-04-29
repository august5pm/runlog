import Image from "next/image";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SignOutButton } from "@/components/SignOutButton";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="mx-auto max-w-md space-y-8">
      <h1 className="text-h1 font-bold text-foreground">설정</h1>

      <div className="flex items-center gap-4 rounded-card border border-border bg-surface p-4 shadow-card">
        {session?.user?.image ? (
          <Image
            src={session.user.image}
            alt=""
            width={56}
            height={56}
            className="rounded-full"
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-muted text-h2 font-bold text-accent">
            {(session?.user?.name ?? session?.user?.email ?? "?").slice(0, 1)}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate font-semibold text-foreground">
            {session?.user?.name ?? "사용자"}
          </p>
          <p className="truncate text-caption text-muted">
            {session?.user?.email}
          </p>
        </div>
      </div>

      <SignOutButton />

      <p className="text-caption text-subtle">RunLog v0.1 · 토이 프로젝트</p>
    </div>
  );
}
