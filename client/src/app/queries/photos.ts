import { useQuery } from '@tanstack/react-query';
import type { Photo } from '../data';
import { apiFetch } from '../lib';

export function usePhotosQuery() {
  return useQuery({
    queryKey: ['photos'],
    queryFn: async () => {
      const res = await apiFetch('/api/photos');
      if (!res.ok) throw new Error('Failed to fetch photos');
      return (await res.json()) as Photo[];
    },
  });
}
