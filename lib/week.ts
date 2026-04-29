/** 월요일 00:00:00.000 (로컬)을 주 시작으로 하는 구간 [start, end). */
export function weekRange(anchor: Date): { start: Date; end: Date } {
  const d = new Date(anchor);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + mondayOffset);

  const start = new Date(d);
  const end = new Date(d);
  end.setDate(end.getDate() + 7);
  return { start, end };
}

/** 해당 달 1일 00:00 ~ 다음 달 1일 00:00 (로컬) 구간 [start, end). */
export function monthRange(anchor: Date): { start: Date; end: Date } {
  const d = new Date(anchor);
  d.setHours(0, 0, 0, 0);
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  return { start, end };
}
