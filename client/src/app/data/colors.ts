// Mirror of server/src/lib/palette.ts. Used as both the static fallback for
// synchronous lookups (PhotoDetail / Upload) and as initialData for the
// /api/palette query that the picker uses dynamically. Keep these in sync;
// /api/palette is the runtime source of truth.
//
// `hex` is the literal/saturated color the server's classifier targets;
// `morandi` is the soft tone we *display* in the UI so the palette doesn't
// feel harsh. Server only knows about `hex` — the morandi values are
// attached client-side (see queries/palette.ts).
//
// True Morandi-inspired palette: low-saturation, earthy, cohesive. Most
// values are pulled directly from a reference swatch image (sage greens,
// burnt orange, slate blue, rust, cream, dark navy). Blue / violet /
// white are improvised to fit the family — the source image has no
// purple and no neutral white.
export interface PaletteEntry {
  id: string;
  name: string;        // literal: "Red", "Blue", etc. — used in pickers/labels
  fancyName: string;   // boutique label — used wherever we want flavor (missions)
  hex: string;
  morandi: string;
}

export const PALETTE: PaletteEntry[] = [
  { id: 'red',    name: 'Red',    fancyName: 'Sunset Coral',     hex: '#FF0000', morandi: '#FF9BA0' },
  { id: 'orange', name: 'Orange', fancyName: 'Burnt Sienna',     hex: '#FF7F00', morandi: '#E18430' },
  { id: 'yellow', name: 'Yellow', fancyName: 'Goldenrod',        hex: '#FFFF00', morandi: '#FCBB67' },
  { id: 'green',  name: 'Green',  fancyName: 'Sage Whisper',     hex: '#00FF00', morandi: '#7C9C7A' },
  { id: 'blue',   name: 'Blue',   fancyName: 'Ocean Mist',       hex: '#0000FF', morandi: '#6E8FAA' },
  { id: 'indigo', name: 'Indigo', fancyName: 'Twilight Indigo',  hex: '#4B0082', morandi: '#465F75' },
  { id: 'violet', name: 'Violet', fancyName: 'Lavender Haze',    hex: '#9400D3', morandi: '#B59CB0' },
  { id: 'pink',   name: 'Pink',   fancyName: 'Blush Rose',       hex: '#FFC0CB', morandi: '#FEC0AE' },
  { id: 'brown',  name: 'Brown',  fancyName: 'Cocoa Earth',      hex: '#8B4513', morandi: '#BD592E' },
  { id: 'white',  name: 'White',  fancyName: 'Cloud White',      hex: '#FFFFFF', morandi: '#F0E8D8' },
  { id: 'gray',   name: 'Gray',   fancyName: 'Misty Slate',      hex: '#808080', morandi: '#B5C5BB' },
  { id: 'black',  name: 'Black',  fancyName: 'Midnight Ink',     hex: '#000000', morandi: '#1E2D3B' },
];

export function getPaletteColor(id: string | null | undefined) {
  if (!id) return null;
  return PALETTE.find((c) => c.id === id) ?? null;
}
