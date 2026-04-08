import { Heart, MessageCircle, Share2, X } from 'lucide-react';
import { useState } from 'react';
import { RAINBOW_COLORS } from '../data/mockData';

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
  colorPalette?: string[];
  userRole?: string;
  commentsList?: Array<{
    id: string;
    username: string;
    text: string;
    avatar?: string;
  }>;
}

interface PhotoDetailProps {
  photo: Photo;
  onClose: () => void;
}

export function PhotoDetail({ photo, onClose }: PhotoDetailProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(photo.likes);

  const color = RAINBOW_COLORS.find((c) => c.id === photo.color);

  const handleLike = () => {
    if (isLiked) {
      setLikeCount(likeCount - 1);
    } else {
      setLikeCount(likeCount + 1);
    }
    setIsLiked(!isLiked);
  };

  // Default color palette if not provided
  const colorPalette = photo.colorPalette || [
    color?.hex || '#4DB6AC',
    '#45A5A0',
    '#3D9B96',
    '#36908C',
  ];

  // Default comments if not provided
  const comments = photo.commentsList || [
    {
      id: '1',
      username: 'Alex Johnson',
      text: 'Amazing color composition! 🎨',
      avatar: 'https://i.pravatar.cc/150?img=1',
    },
    {
      id: '2',
      username: 'Taylor Brown',
      text: 'Love the palette! So inspiring ✨',
      avatar: 'https://i.pravatar.cc/150?img=2',
    },
  ];

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
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
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF8A65] to-[#9575CD] flex items-center justify-center text-white font-bold text-lg">
                  {photo.username.charAt(0)}
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

          {/* Color Palette */}
          <div className="p-6 border-b border-gray-200 bg-white">
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
              Color Palette
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {colorPalette.map((hex) => (
                <div key={hex} className="space-y-2">
                  <div
                    className="aspect-square rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer transform hover:scale-105"
                    style={{ backgroundColor: hex }}
                  />
                  <p className="text-xs text-center text-gray-600 font-mono">{hex.toUpperCase()}</p>
                </div>
              ))}
            </div>
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
              <span className="font-semibold">{likeCount}</span>
            </button>
            <button
              type="button"
              className="flex items-center gap-2 text-gray-600 transition-all transform hover:scale-110"
            >
              <MessageCircle className="w-6 h-6" />
              <span className="font-semibold">{comments.length}</span>
            </button>
            <button
              type="button"
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
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3 animate-slide-up">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4DB6AC] to-[#8BA888] flex items-center justify-center text-white font-bold flex-shrink-0">
                    {comment.username.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-[#2D2520] mb-1">{comment.username}</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{comment.text}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Comment Input */}
            <div className="mt-6 flex gap-3">
              <input
                type="text"
                placeholder="Add a comment..."
                className="flex-1 px-4 py-3 bg-white rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2D2520]/20 transition-all text-sm"
              />
              <button
                type="button"
                className="px-6 py-3 bg-[#2D2520] text-white rounded-2xl font-semibold hover:bg-[#3D3530] transition-all transform hover:scale-105 active:scale-95"
              >
                Post
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
