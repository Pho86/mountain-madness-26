/**
 * Predefined avatar IDs matching SVGs in public/avatars/.
 * Users can choose between Philip, Alexis, Stella, or Emily.
 */
export const AVATAR_IDS = ["Philip", "Alexis", "Stella", "Emily"] as const;

export type AvatarId = (typeof AVATAR_IDS)[number];

export function getAvatarUrl(iconId: string): string {
  const id = AVATAR_IDS.includes(iconId as AvatarId) ? iconId : AVATAR_IDS[0];
  return `/avatars/${id}.svg`;
}
