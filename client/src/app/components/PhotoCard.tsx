import { Heart, MessageCircle, Star } from 'lucide-react';
import { useState } from 'react';
import type { Photo } from '../data/mockData';

interface PhotoCardProps {
  photo: Photo;
  onClick?: () => void;
}

export function PhotoCard({ photo, onClick }: PhotoCardProps) {
  const [liked, setLiked] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [localLikes, setLocalLikes] = useState(photo.likes);
  const [localFavorites, setLocalFavorites] = useState(photo.favorites);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (liked) {
      setLocalLikes(localLikes - 1);
    } else {
      setLocalLikes(localLikes + 1);
    }
    setLiked(!liked);
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (favorited) {
      setLocalFavorites(localFavorites - 1);
    } else {
      setLocalFavorites(localFavorites + 1);
    }
    setFavorited(!favorited);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer w-full text-left"
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick?.(); }}
    >
      <div className="aspect-square relative">
        <img
          src={photo.imageUrl}
          alt={`${photo.color} capture at ${photo.location}`}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="p-3">
        {/* Username and Location - Stack on mobile */}
        <div className="mb-2">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#FF8A65] to-[#9575CD]" />
            <span className="text-sm font-medium text-[#2D2520]">{photo.username}</span>
          </div>
          <div className="text-xs text-gray-500 text-left">{photo.location}</div>
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
    </div>
  );
}
