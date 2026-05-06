/** 프로필 이모지 미설정 시 헤더·설정에 쓰는 기본값 */
export const DEFAULT_PROFILE_EMOJI = "🏃";

/** 닉네임·이름·이메일이 모두 없을 때 표시 라벨 */
export const DEFAULT_DISPLAY_NAME = "러너";

export function resolveDisplayName(user: {
  nickname?: string | null;
  name?: string | null;
  email?: string | null;
}): string {
  const nick = user.nickname?.trim();
  if (nick) return nick;
  const name = user.name?.trim();
  if (name) return name;
  const email = user.email?.trim();
  if (email) {
    const local = email.split("@")[0]?.trim();
    if (local) return local;
    return email;
  }
  return DEFAULT_DISPLAY_NAME;
}

export function resolveProfileEmoji(emoji?: string | null): string {
  const t = emoji?.trim();
  if (t) return t;
  return DEFAULT_PROFILE_EMOJI;
}
