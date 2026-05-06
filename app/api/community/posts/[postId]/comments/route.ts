import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const CONTENT_MAX = 200;

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
    select: { id: true },
  });

  return NextResponse.json({ ok: true, id: comment.id });
}
