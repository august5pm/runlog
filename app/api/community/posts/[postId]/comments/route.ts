import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import {
  communityDisplayName,
  communityProfileEmoji,
} from "@/lib/community-display";
import { prisma } from "@/lib/prisma";

const CONTENT_MAX = 200;
const COMMENTS_PAGE = 120;

export async function GET(
  _req: Request,
  { params }: { params: { postId: string } },
) {
  const { postId } = params;
  if (!postId || typeof postId !== "string") {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const post = await prisma.communityPost.findUnique({
    where: { id: postId },
    select: { id: true },
  });
  if (!post) {
    return NextResponse.json({ error: "글을 찾을 수 없습니다." }, { status: 404 });
  }

  const [rows, total] = await Promise.all([
    prisma.communityComment.findMany({
      where: { postId },
      orderBy: { createdAt: "asc" },
      take: COMMENTS_PAGE,
      include: {
        user: { select: { nickname: true, profileEmoji: true } },
      },
    }),
    prisma.communityComment.count({ where: { postId } }),
  ]);

  return NextResponse.json({
    comments: rows.map((c) => ({
      id: c.id,
      content: c.content,
      createdAt: c.createdAt.toISOString(),
      authorName: communityDisplayName(c.user.nickname),
      authorEmoji: communityProfileEmoji(c.user.profileEmoji),
    })),
    total,
  });
}

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

  if (!body || typeof body !== "object" || typeof (body as { content?: unknown }).content !== "string") {
    return NextResponse.json({ error: "내용 형식이 올바르지 않습니다." }, { status: 400 });
  }

  const content = (body as { content: string }).content.trim().slice(0, CONTENT_MAX);
  if (content.length === 0) {
    return NextResponse.json({ error: "댓글을 입력해 주세요." }, { status: 400 });
  }

  const post = await prisma.communityPost.findUnique({
    where: { id: postId },
    select: { id: true },
  });
  if (!post) {
    return NextResponse.json({ error: "글을 찾을 수 없습니다." }, { status: 404 });
  }

  const comment = await prisma.communityComment.create({
    data: {
      postId,
      userId: session.user.id,
      content,
    },
    include: {
      user: { select: { nickname: true, profileEmoji: true } },
    },
  });

  return NextResponse.json({
    ok: true,
    comment: {
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
      authorName: communityDisplayName(comment.user.nickname),
      authorEmoji: communityProfileEmoji(comment.user.profileEmoji),
    },
  });
}
