/** 서버·클라이언트 공통: 반응 프리셋 (DB kind 값) */
export const COMMUNITY_REACTION_PRESETS = [
  { kind: "clap", emoji: "👏", label: "박수" },
  { kind: "fire", emoji: "🔥", label: "불" },
  { kind: "heart", emoji: "❤️", label: "하트" },
  { kind: "flex", emoji: "💪", label: "힘" },
  { kind: "pray", emoji: "🙏", label: "응원" },
  { kind: "tada", emoji: "🎉", label: "축하" },
] as const;

export type CommunityReactionKind = (typeof COMMUNITY_REACTION_PRESETS)[number]["kind"];

const KIND_SET = new Set<string>(COMMUNITY_REACTION_PRESETS.map((p) => p.kind));

export function isCommunityReactionKind(s: string): s is CommunityReactionKind {
  return KIND_SET.has(s);
}

export function reactionEmoji(kind: string): string {
  const p = COMMUNITY_REACTION_PRESETS.find((x) => x.kind === kind);
  return p?.emoji ?? "·";
}

export function emptyReactionCounts(): Record<CommunityReactionKind, number> {
  return Object.fromEntries(
    COMMUNITY_REACTION_PRESETS.map((p) => [p.kind, 0]),
  ) as Record<CommunityReactionKind, number>;
}

export function aggregateReactionCounts(
  rows: { kind: string }[],
): Record<CommunityReactionKind, number> {
  const base = emptyReactionCounts();
  for (const r of rows) {
    if (isCommunityReactionKind(r.kind)) {
      base[r.kind] += 1;
    }
  }
  return base;
}
