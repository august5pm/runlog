import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ProfileSettingsForm } from "@/components/ProfileSettingsForm";
import { SettingsBadgesSection } from "@/components/SettingsBadgesSection";
import { prisma } from "@/lib/prisma";
import { SignOutButton } from "@/components/SignOutButton";
import {
  resolveDisplayName,
  resolveProfileEmoji,
} from "@/lib/user-display";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  const u = session?.user;

  const goalRow =
    u?.id != null
      ? await prisma.user.findUnique({
          where: { id: u.id },
          select: {
            weeklyDistanceGoalKm: true,
            monthlyDistanceGoalKm: true,
          },
        })
      : null;

  return (
    <div className="mx-auto max-w-md space-y-8">
      <h1 className="text-h1 font-bold text-foreground">설정</h1>

      <div className="flex items-center gap-4 rounded-card border border-border bg-surface p-4 shadow-card">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent-muted text-3xl leading-none"
          aria-hidden
        >
          {u ? resolveProfileEmoji(u.profileEmoji) : "?"}
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold text-foreground">
            {u ? resolveDisplayName(u) : "사용자"}
          </p>
          <p className="truncate text-caption text-muted">{u?.email}</p>
        </div>
      </div>

      {u ? (
        <ProfileSettingsForm
          nickname={u.nickname ?? null}
          profileEmoji={u.profileEmoji ?? null}
          fallbackName={u.name ?? null}
          fallbackEmail={u.email ?? null}
          weeklyDistanceGoalKm={
            goalRow?.weeklyDistanceGoalKm != null
              ? Number(goalRow.weeklyDistanceGoalKm)
              : null
          }
          monthlyDistanceGoalKm={
            goalRow?.monthlyDistanceGoalKm != null
              ? Number(goalRow.monthlyDistanceGoalKm)
              : null
          }
        />
      ) : null}

      {u?.id ? <SettingsBadgesSection userId={u.id} /> : null}

      <SignOutButton />

      <p className="text-caption text-subtle">RunLog v0.1 · 토이 프로젝트</p>
    </div>
  );
}
