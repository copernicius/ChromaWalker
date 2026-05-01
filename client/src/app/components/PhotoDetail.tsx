import { Heart, MessageCircle, Share2, X } from 'lucide-react';
import { useState } from 'react';
import { getPaletteColor } from '../data';
import { useCommentsQuery, useMyLikesQuery, useToggleLikeMutation } from '../queries';
import { CommentThread } from './CommentThread';
import { PhotoShareDialog } from './PhotoShareDialog';

interface Photo {
  id: string;
  imageUrl: string;
  username: string;
  location: string;
  color: string;
  likes: number;
  comments: number;
  favorites: number;
  timestamp: Date;
  caption?: string;
  avatarUrl?: string;
  userRole?: string;
}

interface PhotoDetailProps {
  photo: Photo;
  onClose: () => void;
}

export function PhotoDetail({ photo, onClose }: PhotoDetailProps) {
  const { data: myLikes } = useMyLikesQuery();
  const toggleLike = useToggleLikeMutation();
  const isLiked = myLikes?.includes(photo.id) ?? false;
  const { data: comments = [], isLoading: commentsLoading } = useCommentsQuery(photo.id);
  const [shareOpen, setShareOpen] = useState(false);

  const color = getPaletteColor(photo.color);

  const handleLike = () => {
    if (toggleLike.isPending) return;
    toggleLike.mutate({ id: photo.id, like: !isLiked });
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <div
        className="bg-white rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col md:flex-row animate-scale-in"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        {/* Left Side - Photo */}
        <div className="md:w-2/3 bg-[#2D2520] flex items-center justify-center relative">
          <img
            src={photo.imageUrl}
            alt={photo.caption || photo.location}
            className="w-full h-full object-contain max-h-[60vh] md:max-h-full"
          />
        </div>

        {/* Right Side - Details */}
        <div className="md:w-1/3 flex flex-col bg-[#F5F1ED] max-h-[90vh] md:max-h-auto overflow-y-auto">
          {/* Header with User Info */}
          <div className="p-6 border-b border-gray-200 bg-white">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-[#FF8A65] to-[#9575CD] flex items-center justify-center text-white font-bold text-lg">
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
                <div>
                  <p className="font-bold text-[#2D2520]">{photo.username}</p>
                  <p className="text-sm text-gray-600">{photo.userRole || 'Photographer'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-all hover:rotate-90 transform duration-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Color Tag */}
            {color && (
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white border border-gray-200">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color.hex }} />
                <span className="text-sm font-medium text-[#2D2520]">{color.name}</span>
              </div>
            )}
          </div>

          {/* Caption */}
          <div className="p-6 border-b border-gray-200 bg-white">
            <p className="text-[#2D2520] leading-relaxed">
              {photo.caption ||
                `Beautiful ${color?.name.toLowerCase()} tones captured at ${photo.location}`}
            </p>
          </div>

          {/* Actions */}
          <div className="p-6 border-b border-gray-200 bg-white flex items-center gap-6">
            <button
              type="button"
              onClick={handleLike}
              className={`flex items-center gap-2 transition-all transform hover:scale-110 ${
                isLiked ? 'text-[#FF8A65]' : 'text-gray-600'
              }`}
            >
              <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
              <span className="font-semibold">{photo.likes}</span>
            </button>
            <button
              type="button"
              className="flex items-center gap-2 text-gray-600 transition-all transform hover:scale-110"
            >
              <MessageCircle className="w-6 h-6" />
              <span className="font-semibold">{photo.comments}</span>
            </button>
            <button
              type="button"
              onClick={() => setShareOpen(true)}
              aria-label="Share photo"
              className="flex items-center gap-2 text-gray-600 transition-all transform hover:scale-110 ml-auto"
            >
              <Share2 className="w-6 h-6" />
            </button>
          </div>

          {/* Comments */}
          <div className="p-6 flex-1 bg-[#F5F1ED]">
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">
              Comments
            </h3>
            <CommentThread
              photoId={photo.id}
              comments={comments}
              isLoading={commentsLoading}
            />
          </div>
        </div>
      </div>

      <PhotoShareDialog open={shareOpen} onOpenChange={setShareOpen} photo={photo} />
    </div>
  );
}
