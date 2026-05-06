import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { syncUserBadges } from "@/lib/badges";
import { parseOptionalBpm, parseOptionalCadence } from "@/lib/run-fields";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: { id: string } };

async function getOwnedRun(userId: string, id: string) {
  return prisma.run.findFirst({
    where: { id, userId },
  });
}

export async function GET(_req: Request, { params }: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = params;
  const run = await getOwnedRun(session.user.id, id);
  if (!run) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(run);
}

export async function PATCH(req: Request, { params }: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = params;
  const existing = await getOwnedRun(session.user.id, id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
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

  const bodyRecord = body as Record<string, unknown>;
  const { date, distanceKm, durationSec, notes } = bodyRecord;

  const data: Prisma.RunUpdateInput = {};

  if (date !== undefined) {
    const d = new Date(String(date));
    if (Number.isNaN(d.getTime())) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }
    data.date = d;
  }
  if (distanceKm !== undefined) {
    const dist = Number(distanceKm);
    if (!Number.isFinite(dist) || dist <= 0) {
      return NextResponse.json({ error: "Invalid distance" }, { status: 400 });
    }
    data.distanceKm = new Prisma.Decimal(dist.toFixed(2));
  }
  if (durationSec !== undefined) {
    const dur = Number(durationSec);
    if (!Number.isFinite(dur) || dur <= 0) {
      return NextResponse.json({ error: "Invalid duration" }, { status: 400 });
    }
    data.durationSec = Math.round(dur);
  }
  if (notes !== undefined) {
    data.notes =
      notes == null || notes === ""
        ? null
        : String(notes).slice(0, 2000);
  }
  if ("avgHeartRate" in bodyRecord) {
    const hr = parseOptionalBpm(bodyRecord.avgHeartRate);
    if (!hr.ok) {
      return NextResponse.json({ error: hr.error }, { status: 400 });
    }
    data.avgHeartRate = hr.value;
  }
  if ("cadence" in bodyRecord) {
    const cad = parseOptionalCadence(bodyRecord.cadence);
    if (!cad.ok) {
      return NextResponse.json({ error: cad.error }, { status: 400 });
    }
    data.cadence = cad.value;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const run = await prisma.run.update({
    where: { id },
    data,
  });
  await syncUserBadges(session.user.id);
  return NextResponse.json(run);
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = params;
  const existing = await getOwnedRun(session.user.id, id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await prisma.run.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
