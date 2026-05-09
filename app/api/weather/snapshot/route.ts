import { NextResponse } from "next/server";
import {
  getWeatherSnapshot,
  getWeatherSnapshotAt,
} from "@/lib/kma-weather";

function parseCoord(value: string | null): number | null {
  if (value == null || value === "") return null;
  const n = Number.parseFloat(value);
  if (!Number.isFinite(n)) return null;
  return n;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const latRaw = searchParams.get("lat");
  const lonRaw = searchParams.get("lon");
  const lat = parseCoord(latRaw);
  const lon = parseCoord(lonRaw);

  const hasLat = latRaw != null && latRaw !== "";
  const hasLon = lonRaw != null && lonRaw !== "";

  if (hasLat !== hasLon) {
    return NextResponse.json(
      { ok: false as const, message: "위도·경도를 함께 보내 주세요." },
      { status: 400 },
    );
  }

  if (lat != null && lon != null) {
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return NextResponse.json(
        { ok: false as const, message: "위치 좌표 범위가 올바르지 않습니다." },
        { status: 400 },
      );
    }
    const data = await getWeatherSnapshotAt(lat, lon);
    return NextResponse.json(data);
  }

  const data = await getWeatherSnapshot();
  return NextResponse.json(data);
}
