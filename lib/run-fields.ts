/** 선택 정수 필드: 비우면 null, 범위 밖이면 에러 문자열 */
export function parseOptionalBpm(
  value: unknown,
): { ok: true; value: number | null } | { ok: false; error: string } {
  if (value === undefined || value === null || value === "") {
    return { ok: true, value: null };
  }
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) {
    return { ok: false, error: "평균 심박수는 숫자여야 합니다." };
  }
  if (n < 40 || n > 230) {
    return { ok: false, error: "평균 심박수는 40~230 bpm 범위로 입력해 주세요." };
  }
  return { ok: true, value: n };
}

export function parseOptionalCadence(
  value: unknown,
): { ok: true; value: number | null } | { ok: false; error: string } {
  if (value === undefined || value === null || value === "") {
    return { ok: true, value: null };
  }
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) {
    return { ok: false, error: "케이던스는 숫자여야 합니다." };
  }
  if (n < 60 || n > 240) {
    return { ok: false, error: "케이던스는 60~240 spm(걸음/분) 범위로 입력해 주세요." };
  }
  return { ok: true, value: n };
}
