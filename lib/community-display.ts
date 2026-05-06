import { resolveProfileEmoji } from "@/lib/user-display";

/** 커뮤니티 피드: 닉네임만 표시(미설정 시 고정 문구). 이메일·OAuth 이름 미사용 */
export function communityDisplayName(nickname: string | null | undefined): string {
  const n = nickname?.trim();
  if (n) return n;
  return "닉네임 미설정";
}

export function communityProfileEmoji(emoji: string | null | undefined): string {
  return resolveProfileEmoji(emoji);
}
