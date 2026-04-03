/**
 * Consistent color assignment for collaboration users.
 */

export const PRESENCE_COLORS = [
  "#3B8FE8", // Gemma blue (primary)
  "#E8563B", // Warm red
  "#3BE8A8", // Teal green
  "#E8C93B", // Gold
  "#A83BE8", // Purple
  "#3BE8E8", // Cyan
  "#E83BA8", // Pink
  "#8FE83B", // Lime
];

export function getUserColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash + userId.charCodeAt(i)) | 0;
  }
  return PRESENCE_COLORS[Math.abs(hash) % PRESENCE_COLORS.length];
}
