import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const CONTENT_MAX = 280;

export async function POST(req: Request) {
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

  const b = body as {
    content?: unknown;
    challengeId?: unknown;
    runId?: unknown;
  };

  if (typeof b.content !== "string") {
    return NextResponse.json({ error: "내용 형식이 올바르지 않습니다." }, { status: 400 });
  }

  const content = b.content.trim().slice(0, CONTENT_MAX);
  if (content.length === 0) {
    return NextResponse.json({ error: "한 줄 후기를 입력해 주세요." }, { status: 400 });
  }

  let challengeId: string | null = null;
  if (b.challengeId !== undefined && b.challengeId !== null) {
    if (typeof b.challengeId !== "string") {
      return NextResponse.json({ error: "챌린지 형식이 올바르지 않습니다." }, { status: 400 });
    }
    const trimmed = b.challengeId.trim();
    if (trimmed.length > 0) {
      const ch = await prisma.challenge.findUnique({
        where: { id: trimmed },
        select: { id: true },
      });
      if (!ch) {
        return NextResponse.json({ error: "존재하지 않는 챌린지입니다." }, { status: 400 });
      }
      challengeId = trimmed;
    }
  }

  let runId: string | null = null;
  if (b.runId !== undefined && b.runId !== null) {
    if (typeof b.runId !== "string") {
      return NextResponse.json({ error: "기록 형식이 올바르지 않습니다." }, { status: 400 });
    }
    const trimmed = b.runId.trim();
    if (trimmed.length > 0) {
      const run = await prisma.run.findFirst({
        where: { id: trimmed, userId: session.user.id },
        select: { id: true },
      });
      if (!run) {
        return NextResponse.json(
          { error: "본인의 러닝 기록만 첨부할 수 있습니다." },
          { status: 400 },
        );
      }
      runId = trimmed;
    }
  }

  const post = await prisma.communityPost.create({
    data: {
      userId: session.user.id,
      content,
      challengeId,
      runId,
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, id: post.id });
}
