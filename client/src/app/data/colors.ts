// Mirror of server/src/lib/palette.ts. Used as both the static fallback for
// synchronous lookups (PhotoDetail / Upload) and as initialData for the
// /api/palette query that the picker uses dynamically. Keep these in sync;
// /api/palette is the runtime source of truth.
export interface PaletteEntry {
  id: string;
  name: string;
  hex: string;
}

export const PALETTE: PaletteEntry[] = [
  { id: 'red', name: 'Red', hex: '#FF0000' },
  { id: 'orange', name: 'Orange', hex: '#FF7F00' },
  { id: 'yellow', name: 'Yellow', hex: '#FFFF00' },
  { id: 'green', name: 'Green', hex: '#00FF00' },
  { id: 'blue', name: 'Blue', hex: '#0000FF' },
  { id: 'indigo', name: 'Indigo', hex: '#4B0082' },
  { id: 'violet', name: 'Violet', hex: '#9400D3' },
  { id: 'pink', name: 'Pink', hex: '#FFC0CB' },
  { id: 'brown', name: 'Brown', hex: '#8B4513' },
  { id: 'white', name: 'White', hex: '#FFFFFF' },
  { id: 'gray', name: 'Gray', hex: '#808080' },
  { id: 'black', name: 'Black', hex: '#000000' },
];

export function getPaletteColor(id: string | null | undefined) {
  if (!id) return null;
  return PALETTE.find((c) => c.id === id) ?? null;
}
