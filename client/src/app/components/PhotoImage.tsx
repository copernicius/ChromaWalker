import { ImageOff } from 'lucide-react';
import { useState } from 'react';
import { getPaletteColor } from '../data';

// Resilient photo image. On a load error (R2 404, network blip, broken
// URL), swap to a themed placeholder — a morandi-colored tile with the
// color's fancy name. Fits the brand far better than a broken-image icon.
//
// Three layout modes:
//   • 'cover'   — fills the parent box, crops overflow (grid tiles).
//   • 'contain' — fits inside the parent box, preserves whole image (modal).
//   • 'natural' — image keeps its natural ratio; fallback uses 4:5.
//
// Native lazy + async decoding piggyback on the same surface so callers
// don't have to remember the attributes.

interface PhotoImageProps {
  src: string;
  alt: string;
  // Drives the fallback background. Optional — falls back to neutral grey.
  colorId?: string;
  fit?: 'cover' | 'contain' | 'natural';
  className?: string;
}

export function PhotoImage({
  src,
  alt,
  colorId,
  fit = 'cover',
  className = '',
}: PhotoImageProps) {
  const [errored, setErrored] = useState(false);

  if (errored) {
    const swatch = colorId ? getPaletteColor(colorId) : null;
    const bg = swatch?.morandi ?? '#9E9E9E';
    // 'natural' has no parent-supplied height, so the placeholder needs
    // its own aspect ratio. 'cover' and 'contain' both fill the parent.
    const sizing =
      fit === 'natural' ? 'w-full aspect-[4/5]' : 'w-full h-full';
    return (
      <div
        className={`${sizing} flex items-center justify-center text-white/90 ${className}`}
        style={{ backgroundColor: bg }}
        role="img"
        aria-label={`${alt} (image unavailable)`}
      >
        <div className="flex flex-col items-center gap-1.5 px-4 text-center">
          <ImageOff className="w-8 h-8 opacity-80" />
          <span className="text-[11px] uppercase tracking-wider opacity-90">
            {swatch ? (swatch.fancyName ?? swatch.name) : 'Image unavailable'}
          </span>
        </div>
      </div>
    );
  }

  const sizing =
    fit === 'natural'
      ? 'w-full h-auto block'
      : fit === 'contain'
        ? 'w-full h-full object-contain'
        : 'w-full h-full object-cover';
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setErrored(true)}
      className={`${sizing} ${className}`}
    />
  );
}
