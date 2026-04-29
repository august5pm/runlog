/** durationSec, distanceKm > 0 가정 */
export function paceMinPerKm(durationSec: number, distanceKm: number): number {
  return durationSec / 60 / distanceKm;
}

export function formatPaceMinPerKm(durationSec: number, distanceKm: number): string {
  if (distanceKm <= 0) return "—";
  const minPerKm = paceMinPerKm(durationSec, distanceKm);
  const m = Math.floor(minPerKm);
  const s = Math.round((minPerKm - m) * 60);
  return `${m}'${String(s).padStart(2, "0")}"`;
}

export function formatDuration(durationSec: number): string {
  const m = Math.floor(durationSec / 60);
  const s = durationSec % 60;
  return `${m}분 ${s}초`;
}

export function formatDateLabel(d: Date): string {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    weekday: "short",
  }).format(d);
}

/** 심박·케이던스 한 줄 (없으면 null) */
export function formatHeartCadenceLine(
  avgHeartRate: number | null | undefined,
  cadence: number | null | undefined,
): string | null {
  const parts: string[] = [];
  if (avgHeartRate != null && avgHeartRate > 0) {
    parts.push(`평균 심박 ${avgHeartRate}bpm`);
  }
  if (cadence != null && cadence > 0) {
    parts.push(`케이던스 ${cadence}spm`);
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}

function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function buildWeekChartData(
  weekStart: Date,
  runs: { date: Date; distanceKm: unknown }[],
): { label: string; km: number }[] {
  const byDay = new Map<string, number>();
  for (const r of runs) {
    const k = localDateKey(new Date(r.date));
    const km = Number(r.distanceKm);
    byDay.set(k, (byDay.get(k) ?? 0) + km);
  }

  const out: { label: string; km: number }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    const key = localDateKey(d);
    const short = new Intl.DateTimeFormat("ko-KR", {
      weekday: "short",
    }).format(d);
    out.push({
      label: short,
      km: Math.round((byDay.get(key) ?? 0) * 100) / 100,
    });
  }
  return out;
}

/** 달력 월의 1일~말일까지 일별 거리(km) — label은 일(숫자) */
export function buildMonthChartData(
  monthStart: Date,
  runs: { date: Date; distanceKm: unknown }[],
): { label: string; km: number }[] {
  const byDay = new Map<string, number>();
  for (const r of runs) {
    const k = localDateKey(new Date(r.date));
    const km = Number(r.distanceKm);
    byDay.set(k, (byDay.get(k) ?? 0) + km);
  }

  const s = new Date(monthStart);
  s.setHours(0, 0, 0, 0);
  const year = s.getFullYear();
  const month = s.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const out: { label: string; km: number }[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    const key = localDateKey(d);
    out.push({
      label: String(day),
      km: Math.round((byDay.get(key) ?? 0) * 100) / 100,
    });
  }
  return out;
}
