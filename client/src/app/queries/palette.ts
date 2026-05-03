import { useQuery } from '@tanstack/react-query';
import { PALETTE, type PaletteEntry } from '../data';
import { apiCall } from '../lib';

// The server's response only carries (id, name, hex). Morandi tones and
// boutique fancy names are client display concerns, attached after fetch
// via a static lookup. Unknown ids fall back to raw hex / literal name.
const decorById = new Map(
  PALETTE.map((p) => [p.id, { morandi: p.morandi, fancyName: p.fancyName }]),
);

interface ServerPaletteEntry {
  id: string;
  name: string;
  hex: string;
}

// Fetches the live palette from /api/palette. Falls back to the static
// PALETTE constant via `initialData`, so consumers render immediately without
// a loading state and only re-render if the server's palette differs.
export function usePaletteQuery() {
  return useQuery({
    queryKey: ['palette'],
    queryFn: () => apiCall<ServerPaletteEntry[]>('/api/palette'),
    initialData: PALETTE,
    staleTime: 1000 * 60 * 60, // 1 hour — palette rarely changes
    select: (entries): PaletteEntry[] =>
      entries.map((e) => {
        const decor = decorById.get(e.id);
        return {
          ...e,
          morandi: decor?.morandi ?? e.hex,
          fancyName: decor?.fancyName ?? e.name,
        };
      }),
  });
}
