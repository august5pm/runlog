import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  NICKNAME_MAX_CHARS,
  nicknameCharLength,
} from "@/lib/profile-nickname";
const EMOJI_MAX = 32;
const GOAL_KM_MAX = 999.99;

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 본문입니다." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "본문이 필요합니다." }, { status: 400 });
  }

  const data: {
    nickname?: string | null;
    profileEmoji?: string | null;
    weeklyDistanceGoalKm?: Prisma.Decimal | null;
    monthlyDistanceGoalKm?: Prisma.Decimal | null;
  } = {};

  function assignGoalKm(
    v: unknown,
    fieldLabel: string,
    setter: (dec: Prisma.Decimal | null) => void,
  ): ReturnType<typeof NextResponse.json> | null {
    if (v === null) {
      setter(null);
      return null;
    }
    if (typeof v === "number" || typeof v === "string") {
      const n =
        typeof v === "number" ? v : parseFloat(String(v).trim().replace(",", "."));
      if (!Number.isFinite(n) || n < 0 || n > GOAL_KM_MAX) {
        return NextResponse.json(
          { error: `${fieldLabel}는 0~${GOAL_KM_MAX}km 사이 숫자여야 합니다.` },
          { status: 400 },
        );
      }
      setter(
        n === 0 ? null : new Prisma.Decimal(Math.round(n * 100) / 100),
      );
      return null;
    }
    return NextResponse.json(
      { error: `${fieldLabel} 형식이 올바르지 않습니다.` },
      { status: 400 },
    );
  }

  if ("nickname" in body) {
    const v = (body as { nickname?: unknown }).nickname;
    if (v !== null && typeof v !== "string") {
      return NextResponse.json({ error: "닉네임 형식이 올바르지 않습니다." }, { status: 400 });
    }
    const trimmed = typeof v === "string" ? v.trim() : "";
    if (nicknameCharLength(trimmed) > NICKNAME_MAX_CHARS) {
      return NextResponse.json(
        {
          error: `닉네임은 ${NICKNAME_MAX_CHARS}자 이내로 입력해 주세요.`,
        },
        { status: 400 },
      );
    }
    data.nickname = trimmed.length > 0 ? trimmed : null;
  }

  if ("profileEmoji" in body) {
    const v = (body as { profileEmoji?: unknown }).profileEmoji;
    if (v !== null && typeof v !== "string") {
      return NextResponse.json({ error: "이모지 형식이 올바르지 않습니다." }, { status: 400 });
    }
    const trimmed = typeof v === "string" ? v.trim().slice(0, EMOJI_MAX) : "";
    data.profileEmoji = trimmed.length > 0 ? trimmed : null;
  }

  if ("weeklyDistanceGoalKm" in body) {
    const err = assignGoalKm(
      (body as { weeklyDistanceGoalKm?: unknown }).weeklyDistanceGoalKm,
      "주간 목표",
      (dec) => {
        data.weeklyDistanceGoalKm = dec;
      },
    );
    if (err) return err;
  }

  if ("monthlyDistanceGoalKm" in body) {
    const err = assignGoalKm(
      (body as { monthlyDistanceGoalKm?: unknown }).monthlyDistanceGoalKm,
      "월간 목표",
      (dec) => {
        data.monthlyDistanceGoalKm = dec;
      },
    );
    if (err) return err;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json(
      { error: "수정할 항목이 없습니다." },
      { status: 400 },
    );
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data,
  });

  return NextResponse.json({ ok: true });
}
