import { useQuery } from '@tanstack/react-query';
import { PALETTE, type PaletteEntry } from '../data';
import { apiCall } from '../lib';

// Fetches the live palette from /api/palette. Falls back to the static
// PALETTE constant via `initialData`, so consumers render immediately without
// a loading state and only re-render if the server's palette differs.
export function usePaletteQuery() {
  return useQuery({
    queryKey: ['palette'],
    queryFn: () => apiCall<PaletteEntry[]>('/api/palette'),
    initialData: PALETTE,
    staleTime: 1000 * 60 * 60, // 1 hour — palette rarely changes
  });
}
