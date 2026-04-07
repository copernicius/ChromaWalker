import { Heart, MessageCircle, Star } from 'lucide-react';
import { memo, useCallback, useState } from 'react';
import type { Photo } from '../data/mockData';
import { LazyImage } from './LazyImage';

export interface PhotoCardProps {
  photo: Photo;
  onClick?: () => void;
}

export const PhotoCard = memo(({ photo, onClick }: PhotoCardProps) => {
  const [liked, setLiked] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [localLikes, setLocalLikes] = useState(photo.likes);
  const [localFavorites, setLocalFavorites] = useState(photo.favorites);

  const handleLike = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setLiked((prev) => {
      setLocalLikes((l) => (prev ? l - 1 : l + 1));
      return !prev;
    });
  }, []);

  const handleFavorite = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorited((prev) => {
      setLocalFavorites((f) => (prev ? f - 1 : f + 1));
      return !prev;
    });
  }, []);

  return (
    <button
      type="button"
      className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer border-none p-0 text-left w-full"
      onClick={onClick}
    >
      <div className="aspect-square relative">
        <LazyImage
          src={photo.imageUrl}
          alt={`${photo.color} photo at ${photo.location}`}
          className="w-full h-full"
        />
      </div>

      <div className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#FF8A65] to-[#9575CD] shrink-0" />
          <div className="min-w-0">
            <span className="text-sm font-medium text-[#2D2520] block">{photo.username}</span>
            <span className="text-xs text-gray-500 block truncate">{photo.location}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleLike}
              className="flex items-center gap-1 text-sm hover:text-[#FF8A65] transition-colors"
            >
              <Heart
                className={`w-4 h-4 ${liked ? 'fill-[#FF8A65] text-[#FF8A65]' : 'text-gray-600'}`}
              />
              <span className="text-gray-600">{localLikes}</span>
            </button>

            <button
              type="button"
              className="flex items-center gap-1 text-sm hover:text-[#4DB6AC] transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-gray-600" />
              <span className="text-gray-600">{photo.comments}</span>
            </button>

            <button
              type="button"
              onClick={handleFavorite}
              className="flex items-center gap-1 text-sm hover:text-[#FFD54F] transition-colors"
            >
              <Star
                className={`w-4 h-4 ${favorited ? 'fill-[#FFD54F] text-[#FFD54F]' : 'text-gray-600'}`}
              />
              <span className="text-gray-600">{localFavorites}</span>
            </button>
          </div>
        </div>
      </div>
    </button>
  );
});

PhotoCard.displayName = 'PhotoCard';
