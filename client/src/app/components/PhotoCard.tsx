import { Heart, MessageCircle, Star, Trash2 } from 'lucide-react';
import type { Photo } from '../data';
import {
  useMyBookmarksQuery,
  useMyLikesQuery,
  useToggleBookmarkMutation,
  useToggleLikeMutation,
} from '../queries';
import { PhotoImage } from './PhotoImage';
import { UserAvatar } from './UserAvatar';

interface PhotoCardProps {
  photo: Photo;
  onClick?: () => void;
  onDelete?: () => void;
  // 'square' (default) crops to a uniform tile — used by Home's small grids.
  // 'natural' lets each image keep its real ratio so a CSS-columns waterfall
  // gets variable-height cards (the actual masonry effect).
  aspect?: 'square' | 'natural';
}

export function PhotoCard({ photo, onClick, onDelete, aspect = 'square' }: PhotoCardProps) {
  const isNatural = aspect === 'natural';
  const { data: myLikes } = useMyLikesQuery();
  const toggleLike = useToggleLikeMutation();
  const liked = myLikes?.includes(photo.id) ?? false;

  const { data: myBookmarks } = useMyBookmarksQuery();
  const toggleBookmark = useToggleBookmarkMutation();
  const favorited = myBookmarks?.includes(photo.id) ?? false;

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (toggleLike.isPending) return;
    toggleLike.mutate({ id: photo.id, like: !liked });
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (toggleBookmark.isPending) return;
    toggleBookmark.mutate({ id: photo.id, bookmark: !favorited });
  };

  return (
    <div
      role="button"
      tabIndex={0}
      className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer w-full text-left"
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick?.(); }}
    >
      <div
        className={`relative bg-gray-100 ${isNatural ? '' : 'aspect-square'}`}
      >
        <PhotoImage
          src={photo.imageUrl}
          alt={`${photo.color} capture at ${photo.location}`}
          colorId={photo.color}
          fit={isNatural ? 'natural' : 'cover'}
        />
        {onDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            aria-label="Delete photo"
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 hover:bg-red-500 text-white flex items-center justify-center backdrop-blur-sm transition-colors active:scale-95"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="p-3">
        {/* Username and Location - Stack on mobile */}
        <div className="mb-2">
          <div className="flex items-center gap-2 mb-1">
            <UserAvatar url={photo.avatarUrl} name={photo.username} size={28} />
            <span className="text-sm font-medium text-[#2D2520]">{photo.username}</span>
          </div>
          {/* Reserve one line of vertical space even when location is empty
              so cards stay the same height across the grid. */}
          <div
            className="text-xs text-gray-500 text-left truncate min-h-[1lh]"
            title={photo.location}
          >
            {photo.location?.trim() || (
              <span className="text-gray-400 italic">No location</span>
            )}
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
              <span className="text-gray-600">{photo.likes}</span>
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
              <span className="text-gray-600">{photo.favorites}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
