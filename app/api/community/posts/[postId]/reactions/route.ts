import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import {
  aggregateReactionCounts,
  isCommunityReactionKind,
} from "@/lib/community-reactions";
import { prisma } from "@/lib/prisma";

async function reactionPayload(postId: string, userId: string) {
  const rows = await prisma.communityPostReaction.findMany({
    where: { postId },
    select: { kind: true },
  });
  const mine = await prisma.communityPostReaction.findUnique({
    where: { postId_userId: { postId, userId } },
    select: { kind: true },
  });
  return {
    reactionCounts: aggregateReactionCounts(rows),
    myReactionKind: mine?.kind && isCommunityReactionKind(mine.kind) ? mine.kind : null,
  };
}

/** 같은 종류 다시 누르면 취소, 다른 종류면 교체 */
export async function POST(
  req: Request,
  { params }: { params: { postId: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { postId } = params;
  if (!postId || typeof postId !== "string") {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 본문입니다." }, { status: 400 });
  }

  if (!body || typeof body !== "object" || typeof (body as { kind?: unknown }).kind !== "string") {
    return NextResponse.json({ error: "반응 종류가 필요합니다." }, { status: 400 });
  }

  const kind = (body as { kind: string }).kind.trim();
  if (!isCommunityReactionKind(kind)) {
    return NextResponse.json({ error: "지원하지 않는 반응입니다." }, { status: 400 });
  }

  const post = await prisma.communityPost.findUnique({
    where: { id: postId },
    select: { id: true },
  });
  if (!post) {
    return NextResponse.json({ error: "글을 찾을 수 없습니다." }, { status: 404 });
  }

  const existing = await prisma.communityPostReaction.findUnique({
    where: {
      postId_userId: { postId, userId: session.user.id },
    },
    select: { kind: true },
  });

  if (existing?.kind === kind) {
    await prisma.communityPostReaction.delete({
      where: { postId_userId: { postId, userId: session.user.id } },
    });
    const next = await reactionPayload(postId, session.user.id);
    return NextResponse.json({
      ok: true,
      state: "removed" as const,
      ...next,
    });
  }

  await prisma.communityPostReaction.upsert({
    where: { postId_userId: { postId, userId: session.user.id } },
    create: { postId, userId: session.user.id, kind },
    update: { kind },
  });

  const next = await reactionPayload(postId, session.user.id);
  return NextResponse.json({
    ok: true,
    state: existing ? ("updated" as const) : ("set" as const),
    ...next,
  });
}
