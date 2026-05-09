/** 닉네임 최대 글자 수 (설정 폼·`PATCH /api/user/profile` 와 동일) */
export const NICKNAME_MAX_CHARS = 5;

/** 유니코드 코드 포인트 기준 길이 (한글·이모지 1글자씩) */
export function nicknameCharLength(s: string): number {
  return Array.from(s).length;
}

/** 입력 필드에서 초과 입력 방지 */
export function truncateNicknameInput(raw: string): string {
  const chars = Array.from(raw);
  if (chars.length <= NICKNAME_MAX_CHARS) return raw;
  return chars.slice(0, NICKNAME_MAX_CHARS).join("");
}
