import { useQuery } from '@tanstack/react-query';
import type { Mission } from '../data';
import { apiFetch } from '../lib';

export function useMissionsQuery() {
  return useQuery({
    queryKey: ['missions'],
    queryFn: async () => {
      const res = await apiFetch('/api/missions');
      if (!res.ok) throw new Error('Failed to fetch missions');
      return (await res.json()) as Mission[];
    },
  });
}
