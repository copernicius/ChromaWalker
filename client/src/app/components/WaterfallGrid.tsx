import type { Photo } from '../data';
import { PhotoCard } from './PhotoCard';

// Pinterest-style masonry layout via native CSS columns. Each card flows
// into the shortest column based on its natural image height — no JS layout
// math, no resize observers, no extra deps. Pairs with PhotoCard's
// `aspect="natural"` mode (variable heights) and the browser-native
// `loading="lazy"` on each image so off-screen photos don't fetch until
// the user scrolls near them.

interface WaterfallGridProps {
  photos: Photo[];
  onSelect?: (photoId: string) => void;
  onDelete?: (photoId: string) => void;
}

export function WaterfallGrid({ photos, onSelect, onDelete }: WaterfallGridProps) {
  return (
    <div className="columns-2 gap-4">
      {photos.map((photo) => (
        <div key={photo.id} className="break-inside-avoid mb-4">
          <PhotoCard
            photo={photo}
            aspect="natural"
            onClick={onSelect ? () => onSelect(photo.id) : undefined}
            onDelete={onDelete ? () => onDelete(photo.id) : undefined}
          />
        </div>
      ))}
    </div>
  );
}
