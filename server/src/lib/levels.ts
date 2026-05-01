// Tier rules: source of truth for the level system. Each tier has a minimum
// points threshold; a user's level is the highest tier whose threshold their
// points have crossed. Add a new tier by appending an entry — bump the level
// number and pick a sensible minPoints.
//
// `User.points` stays the only stored value; level + progress are *derived*
// from these rules at read time. Don't store `level` on User again.

export interface Level {
  level: number;
  name: string;
  minPoints: number;
  color: string;
}

export const LEVELS: Level[] = [
  { level: 1, name: 'Color Seeker', minPoints: 0, color: '#9E9E9E' },
  { level: 2, name: 'Spectrum Scout', minPoints: 100, color: '#FF8A65' },
  { level: 3, name: 'Hue Hunter', minPoints: 250, color: '#FFD54F' },
  { level: 4, name: 'Palette Pioneer', minPoints: 500, color: '#8BA888' },
  { level: 5, name: 'Chroma Curator', minPoints: 1000, color: '#4DB6AC' },
  { level: 6, name: 'Rainbow Ranger', minPoints: 1500, color: '#9575CD' },
  { level: 7, name: 'Prism Master', minPoints: 2200, color: '#C89F7B' },
  { level: 8, name: 'Color Sage', minPoints: 3000, color: '#E91E63' },
];
