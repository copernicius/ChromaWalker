import { useQuery } from '@tanstack/react-query';
import { apiCall } from '../lib';
import { useAppStore } from '../store';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  total: number;
  progress: number;
  unlocked: boolean;
}

// Server-hydrated achievements: config in lib/achievements.ts, per-user
// progress computed at request time. Skipped when not signed in.
export function useMyAchievementsQuery() {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['my-achievements'],
    queryFn: () => apiCall<Achievement[]>('/api/achievements/me'),
    enabled: isAuthenticated,
  });
}
