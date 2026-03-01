/**
 * Predefined avatar IDs used with DiceBear Avataaars.
 * Each ID is a seed for a deterministic avatar image.
 */
export const AVATAR_IDS = [
  "felix",
  "aaron",
  "buster",
  "ginger",
  "midnight",
  "callie",
  "bandit",
  "bear",
  "chester",
  "luna",
  "max",
  "mimi",
  "molie",
  "shadow",
  "simba",
  "smokey",
  "tiger",
  "whiskers",
  "zoe",
] as const;

export type AvatarId = (typeof AVATAR_IDS)[number];

const BASE_URL = "https://api.dicebear.com/7.x/avataaars/svg";

export function getAvatarUrl(iconId: string): string {
  const seed = AVATAR_IDS.includes(iconId as AvatarId) ? iconId : AVATAR_IDS[0];
  return `${BASE_URL}?seed=${encodeURIComponent(seed)}`;
}
