// Shared palette: source of truth for both /api/detect-color (classification)
// and /api/palette (the endpoint the client uses to render the filter picker
// and color labels). Adding a color here means it can be detected, filtered,
// and displayed end-to-end — no other code needs to change.

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

export const PALETTE_IDS = new Set(PALETTE.map((c) => c.id));

export type PaletteId = (typeof PALETTE)[number]['id'];
