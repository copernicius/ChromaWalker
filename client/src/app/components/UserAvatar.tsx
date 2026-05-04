import { useState } from 'react';

// Resilient user avatar: gradient tile + first-letter monogram when the
// remote image is missing OR fails to load (broken Google CDN URL,
// post-migration /tmp paths, network blip). `referrerPolicy="no-referrer"`
// is required for Google avatars (lh3.googleusercontent.com), which 403
// when a Referer header is present from another origin.
//
// The monogram font scales with the avatar size — explicit fontClass
// overrides if a caller wants something custom.

interface UserAvatarProps {
  /** Image URL. Empty string / undefined renders the monogram directly. */
  url?: string;
  /** Display name. First non-whitespace char becomes the monogram. */
  name: string;
  /** Pixel size of the avatar (square). */
  size: number;
  /** Override the monogram's text-* class (e.g. 'text-base'). */
  fontClass?: string;
  /** Extra classes appended to the outer div (e.g. 'shrink-0', 'shadow-md'). */
  className?: string;
  /**
   * Tailwind gradient classes for the fallback tile (e.g.
   * 'from-[#4DB6AC] to-[#8BA888]'). Defaults to the brand orange→purple.
   * Override to visually distinguish a class of users (e.g. comment
   * authors keep a teal accent).
   */
  gradientClass?: string;
}

const DEFAULT_GRADIENT = 'from-[#FF8A65] to-[#9575CD]';

function defaultFontClass(size: number): string {
  if (size <= 28) return 'text-xs';
  if (size <= 40) return 'text-sm';
  if (size <= 56) return 'text-base';
  return 'text-lg';
}

export function UserAvatar({
  url,
  name,
  size,
  fontClass,
  className = '',
  gradientClass = DEFAULT_GRADIENT,
}: UserAvatarProps) {
  const [errored, setErrored] = useState(false);
  const showImg = !!url && !errored;
  const monogramFont = fontClass ?? defaultFontClass(size);
  return (
    <div
      className={`rounded-full overflow-hidden bg-gradient-to-br ${gradientClass} flex items-center justify-center text-white font-bold shrink-0 ${monogramFont} ${className}`}
      style={{ width: size, height: size }}
    >
      {showImg ? (
        <img
          src={url}
          alt={name}
          referrerPolicy="no-referrer"
          loading="lazy"
          decoding="async"
          onError={() => setErrored(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        (name.trim().charAt(0) || '?').toUpperCase()
      )}
    </div>
  );
}
