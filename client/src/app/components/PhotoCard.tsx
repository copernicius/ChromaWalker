import { Heart, MessageCircle, Star, Trash2 } from 'lucide-react';
import type { Photo } from '../data';
import {
  useMyBookmarksQuery,
  useMyLikesQuery,
  useToggleBookmarkMutation,
  useToggleLikeMutation,
} from '../queries';

interface PhotoCardProps {
  photo: Photo;
  onClick?: () => void;
  onDelete?: () => void;
}

export function PhotoCard({ photo, onClick, onDelete }: PhotoCardProps) {
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
      <div className="aspect-square relative">
        <img
          src={photo.imageUrl}
          alt={`${photo.color} capture at ${photo.location}`}
          className="w-full h-full object-cover"
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
            <div className="w-7 h-7 rounded-full overflow-hidden bg-gradient-to-br from-[#FF8A65] to-[#9575CD] flex items-center justify-center text-white text-xs font-bold">
              {photo.avatarUrl ? (
                <img
                  src={photo.avatarUrl}
                  alt={photo.username}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                photo.username.charAt(0).toUpperCase()
              )}
            </div>
            <span className="text-sm font-medium text-[#2D2520]">{photo.username}</span>
          </div>
          <div className="text-xs text-gray-500 text-left truncate" title={photo.location}>
            {photo.location}
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
