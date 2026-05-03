// Achievement catalog. Each entry declares a `kind` (what stat to count for
// the current user) and a `total` threshold to unlock. Per-user `progress`
// is derived at read time in achievementsController — no DB writes for
// achievement state. Add an achievement by appending an entry; if its
// `kind` is already supported by the controller, no other code changes.

export type AchievementKind =
  | 'distinct_locations'
  | 'photos_uploaded'
  | 'missions_completed_solo'
  | 'missions_completed_team'
  | 'colors_unlocked'
  | 'likes_given'
  | 'likes_received';

export interface AchievementConfig {
  id: string;
  name: string;
  description: string;
  icon: string; // lucide icon hint; client may or may not render it
  kind: AchievementKind;
  total: number;
}

export const ACHIEVEMENTS: AchievementConfig[] = [
  {
    id: 'a1',
    name: 'Explorer',
    description: 'Upload photos in 5 different locations',
    icon: 'map-pin',
    kind: 'distinct_locations',
    total: 5,
  },
  {
    id: 'a2',
    name: 'Color Hunter',
    description: 'Upload 10 photos',
    icon: 'camera',
    kind: 'photos_uploaded',
    total: 10,
  },
  {
    id: 'a3',
    name: 'Puzzle Master',
    description: 'Complete 5 solo missions',
    icon: 'target',
    kind: 'missions_completed_solo',
    total: 5,
  },
  {
    id: 'a4',
    name: 'Team Player',
    description: 'Join 10 team missions',
    icon: 'users',
    kind: 'missions_completed_team',
    total: 10,
  },
  {
    id: 'a5',
    name: 'Spectrum Master',
    description: 'Unlock all 12 colors',
    icon: 'palette',
    kind: 'colors_unlocked',
    total: 12,
  },
  {
    id: 'a6',
    name: 'Friendly Soul',
    description: 'Like 25 photos by other ChromaWalkers',
    icon: 'heart',
    kind: 'likes_given',
    total: 25,
  },
  {
    id: 'a7',
    name: 'Crowd Favorite',
    description: 'Earn 50 likes on your photos',
    icon: 'sparkles',
    kind: 'likes_received',
    total: 50,
  },
];
