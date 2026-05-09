/** 서울 기준 시(hour 0–23) — `Intl`로 계산 */
export function hourInSeoul(at: Date): number {
  const hourPart = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Seoul",
    hour: "numeric",
    hour12: false,
  }).formatToParts(at).find((p) => p.type === "hour")?.value;
  const h = hourPart != null ? parseInt(hourPart, 10) : NaN;
  return Number.isFinite(h) ? h % 24 : 12;
}

/**
 * 대시보드 인사 — 서울 시간대 기준 오전·낮·오후·밤.
 * - 오전 6–11
 * - 낮 12–14
 * - 오후 15–20
 * - 밤 21–5
 */
export function dashboardGreeting(displayName: string, at: Date = new Date()): string {
  const name = displayName;
  const hour = hourInSeoul(at);

  if (hour >= 6 && hour < 12) {
    return `상쾌한 아침이에요, ${name}님`;
  }
  if (hour >= 12 && hour < 15) {
    return `즐거운 점심 시간이에요, ${name}님`;
  }
  if (hour >= 15 && hour < 21) {
    return `여유로운 오후 보내세요, ${name}님`;
  }
  return `편안한 밤 되세요, ${name}님`;
}
