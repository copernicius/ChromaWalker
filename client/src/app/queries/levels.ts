import { useQuery } from '@tanstack/react-query';
import { apiCall } from '../lib';

export interface Level {
  level: number;
  name: string;
  minPoints: number;
  color: string;
}

// Static fallback mirrors server/src/lib/levels.ts. Used as initialData so
// consumers render synchronously; the server's authoritative copy refreshes
// the cache on first fetch (which fires at app boot — see Root.tsx).
const STATIC_LEVELS: Level[] = [
  { level: 1, name: 'Color Seeker', minPoints: 0, color: '#9E9E9E' },
  { level: 2, name: 'Spectrum Scout', minPoints: 100, color: '#FF8A65' },
  { level: 3, name: 'Hue Hunter', minPoints: 250, color: '#FFD54F' },
  { level: 4, name: 'Palette Pioneer', minPoints: 500, color: '#8BA888' },
  { level: 5, name: 'Chroma Curator', minPoints: 1000, color: '#4DB6AC' },
  { level: 6, name: 'Rainbow Ranger', minPoints: 1500, color: '#9575CD' },
  { level: 7, name: 'Prism Master', minPoints: 2200, color: '#C89F7B' },
  { level: 8, name: 'Color Sage', minPoints: 3000, color: '#E91E63' },
];

export function useLevelsQuery() {
  return useQuery({
    queryKey: ['levels'],
    queryFn: () => apiCall<Level[]>('/api/levels'),
    initialData: STATIC_LEVELS,
    staleTime: 1000 * 60 * 60, // 1h — rules are config, rarely change
  });
}

// Pure helpers. Take the levels array explicitly so they're easy to test
// and don't pull react-query into non-component code.
export function getCurrentLevel(points: number, levels: Level[]): Level {
  let current = levels[0];
  for (const l of levels) {
    if (points >= l.minPoints) current = l;
  }
  return current;
}

export function getNextLevel(points: number, levels: Level[]): Level | null {
  for (const l of levels) {
    if (l.minPoints > points) return l;
  }
  return null; // capped — user is at the highest tier
}

interface LevelInfo {
  current: Level;
  next: Level | null;
  pointsIntoLevel: number;   // points earned within the current tier
  pointsForNextLevel: number; // span between current and next tier
  progressPercent: number;   // 0..100; 100 if maxed out
}

// Convenience hook: subscribes to the levels query and returns everything
// the UI needs about a user's progress.
export function useUserLevel(points: number): LevelInfo {
  const { data: levels } = useLevelsQuery();
  const current = getCurrentLevel(points, levels);
  const next = getNextLevel(points, levels);

  if (!next) {
    return {
      current,
      next: null,
      pointsIntoLevel: points - current.minPoints,
      pointsForNextLevel: 0,
      progressPercent: 100,
    };
  }

  const pointsIntoLevel = points - current.minPoints;
  const pointsForNextLevel = next.minPoints - current.minPoints;
  return {
    current,
    next,
    pointsIntoLevel,
    pointsForNextLevel,
    progressPercent: (pointsIntoLevel / pointsForNextLevel) * 100,
  };
}
