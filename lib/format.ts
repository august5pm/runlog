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

/** 해당 연도 1~12월 월별 거리 합산 (runs는 해당 연도로 필터된 것을 넣음) */
export function buildYearChartData(
  yearStart: Date,
  runs: { date: Date; distanceKm: unknown }[],
): { label: string; km: number }[] {
  const y = yearStart.getFullYear();
  const byMonth = new Map<number, number>();
  for (const r of runs) {
    const d = new Date(r.date);
    if (d.getFullYear() !== y) continue;
    const m = d.getMonth();
    const km = Number(r.distanceKm);
    byMonth.set(m, (byMonth.get(m) ?? 0) + km);
  }

  const out: { label: string; km: number }[] = [];
  for (let month = 0; month < 12; month++) {
    const label = new Intl.DateTimeFormat("ko-KR", { month: "short" }).format(
      new Date(y, month, 1),
    );
    out.push({
      label,
      km: Math.round((byMonth.get(month) ?? 0) * 100) / 100,
    });
  }
  return out;
}

/** 전체 기간: 기록이 있는 월 단위로 합산 (시간순) */
export function buildAllTimeChartData(
  runs: { date: Date; distanceKm: unknown }[],
): { label: string; km: number }[] {
  if (runs.length === 0) return [];

  const byMonthKey = new Map<string, number>();
  for (const r of runs) {
    const d = new Date(r.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const km = Number(r.distanceKm);
    byMonthKey.set(key, (byMonthKey.get(key) ?? 0) + km);
  }

  const keys = Array.from(byMonthKey.keys()).sort();
  const fmt = new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "short",
  });

  return keys.map((key) => {
    const [ys, ms] = key.split("-").map(Number);
    const label = fmt.format(new Date(ys, ms - 1, 1));
    return {
      label,
      km: Math.round((byMonthKey.get(key) ?? 0) * 100) / 100,
    };
  });
}
