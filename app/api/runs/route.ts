import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { parseOptionalBpm, parseOptionalCadence } from "@/lib/run-fields";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const limit = Math.min(
    Math.max(parseInt(searchParams.get("limit") ?? "30", 10) || 30, 1),
    100,
  );

  const runs = await prisma.run.findMany({
    where: {
      userId: session.user.id,
      ...(from || to
        ? {
            date: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
    },
    orderBy: { date: "desc" },
    take: limit,
  });

  return NextResponse.json(runs);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { date, distanceKm, durationSec, notes, avgHeartRate, cadence } =
    body as Record<string, unknown>;

  if (date == null || distanceKm == null || durationSec == null) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const d = new Date(String(date));
  if (Number.isNaN(d.getTime())) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const dist = Number(distanceKm);
  const dur = Number(durationSec);
  if (!Number.isFinite(dist) || !Number.isFinite(dur) || dist <= 0 || dur <= 0) {
    return NextResponse.json(
      { error: "Invalid distance or duration" },
      { status: 400 },
    );
  }

  const noteStr =
    notes == null || notes === ""
      ? null
      : String(notes).slice(0, 2000);

  const hr = parseOptionalBpm(avgHeartRate);
  if (!hr.ok) {
    return NextResponse.json({ error: hr.error }, { status: 400 });
  }
  const cad = parseOptionalCadence(cadence);
  if (!cad.ok) {
    return NextResponse.json({ error: cad.error }, { status: 400 });
  }

  const run = await prisma.run.create({
    data: {
      userId: session.user.id,
      date: d,
      distanceKm: new Prisma.Decimal(dist.toFixed(2)),
      durationSec: Math.round(dur),
      avgHeartRate: hr.value,
      cadence: cad.value,
      notes: noteStr,
    },
  });

  return NextResponse.json(run, { status: 201 });
}
