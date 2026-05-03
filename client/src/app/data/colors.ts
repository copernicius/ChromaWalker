// Mirror of server/src/lib/palette.ts. Used as both the static fallback for
// synchronous lookups (PhotoDetail / Upload) and as initialData for the
// /api/palette query that the picker uses dynamically. Keep these in sync;
// /api/palette is the runtime source of truth.
//
// `hex` is the literal/saturated color the server's classifier targets;
// `morandi` is the soft, low-saturation tone we *display* in the UI so the
// palette doesn't feel harsh. Server only knows about `hex` — the morandi
// values are attached client-side (see queries/palette.ts).
export interface PaletteEntry {
  id: string;
  name: string;        // literal: "Red", "Blue", etc. — used in pickers/labels
  fancyName: string;   // boutique label — used wherever we want flavor (missions)
  hex: string;
  morandi: string;
}

export const PALETTE: PaletteEntry[] = [
  { id: 'red',    name: 'Red',    fancyName: 'Sunset Coral',     hex: '#FF0000', morandi: '#B86060' },
  { id: 'orange', name: 'Orange', fancyName: 'Burnt Sienna',     hex: '#FF7F00', morandi: '#C08762' },
  { id: 'yellow', name: 'Yellow', fancyName: 'Goldenrod',        hex: '#FFFF00', morandi: '#B8A552' },
  { id: 'green',  name: 'Green',  fancyName: 'Sage Whisper',     hex: '#00FF00', morandi: '#7E9683' },
  // Blue pushed deeper + bluer so it doesn't read as gray next to the
  // warm taupe/sand tones.
  { id: 'blue',   name: 'Blue',   fancyName: 'Ocean Mist',       hex: '#0000FF', morandi: '#5F7B96' },
  { id: 'indigo', name: 'Indigo', fancyName: 'Twilight Indigo',  hex: '#4B0082', morandi: '#6E6886' },
  { id: 'violet', name: 'Violet', fancyName: 'Lavender Haze',    hex: '#9400D3', morandi: '#9C7E94' },
  { id: 'pink',   name: 'Pink',   fancyName: 'Blush Rose',       hex: '#FFC0CB', morandi: '#C28C8C' },
  { id: 'brown',  name: 'Brown',  fancyName: 'Cocoa Earth',      hex: '#8B4513', morandi: '#846B5C' },
  { id: 'white',  name: 'White',  fancyName: 'Cloud White',      hex: '#FFFFFF', morandi: '#E8E0D0' },
  { id: 'gray',   name: 'Gray',   fancyName: 'Misty Slate',      hex: '#808080', morandi: '#8A857D' },
  { id: 'black',  name: 'Black',  fancyName: 'Midnight Ink',     hex: '#000000', morandi: '#2D2A28' },
];

export function getPaletteColor(id: string | null | undefined) {
  if (!id) return null;
  return PALETTE.find((c) => c.id === id) ?? null;
}
