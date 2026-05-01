import { Heart, Info, MessageCircle, Star, X } from 'lucide-react';
import { AnimatePresence, type PanInfo, motion } from 'motion/react';
import { useState } from 'react';
import { type Photo, RAINBOW_COLORS } from '../data';

interface CardStackProps {
  photos: Photo[];
}

export function CardStack({ photos }: CardStackProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);

  const handleSwipe = (dir: 'left' | 'right') => {
    setDirection(dir);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % photos.length);
      setDirection(null);
    }, 300);
  };

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const swipeThreshold = 100;
    if (info.offset.x > swipeThreshold) {
      handleSwipe('right');
    } else if (info.offset.x < -swipeThreshold) {
      handleSwipe('left');
    }
  };

  if (photos.length === 0) {
    return (
      <div className="flex items-center justify-center h-[500px] bg-white rounded-3xl">
        <p className="text-gray-500">No photos available</p>
      </div>
    );
  }

  const visiblePhotos = [
    photos[currentIndex],
    photos[(currentIndex + 1) % photos.length],
    photos[(currentIndex + 2) % photos.length],
  ];

  return (
    <div className="relative h-[550px] w-full">
      <AnimatePresence>
        {visiblePhotos.map((photo, index) => {
          const actualIndex = (currentIndex + index) % photos.length;
          const color = RAINBOW_COLORS.find((c) => c.id === photo.color);
          const isTop = index === 0;

          return (
            <motion.div
              key={`${photo.id}-${actualIndex}`}
              className="absolute w-full"
              style={{
                zIndex: 10 - index,
              }}
              initial={false}
              animate={{
                scale: 1 - index * 0.05,
                y: index * 12,
                opacity: index === 0 ? 1 : 0.7,
                rotateZ: index * 2,
              }}
              exit={{
                x: direction === 'left' ? -400 : direction === 'right' ? 400 : 0,
                opacity: 0,
                transition: { duration: 0.3 },
              }}
              drag={isTop ? 'x' : false}
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={isTop ? handleDragEnd : undefined}
              whileDrag={isTop ? { scale: 1.05, cursor: 'grabbing' } : {}}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 30,
              }}
            >
              <div
                className={`bg-white rounded-3xl shadow-2xl overflow-hidden ${isTop ? 'cursor-grab active:cursor-grabbing' : ''}`}
              >
                {/* Photo */}
                <div className="relative aspect-[4/5] overflow-hidden">
                  <img
                    src={photo.imageUrl}
                    alt={photo.location}
                    className="w-full h-full object-cover"
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/20" />

                  {/* Color Tag */}
                  <div
                    className="absolute top-4 right-4 px-4 py-2 rounded-full text-white text-sm font-semibold shadow-lg backdrop-blur-sm"
                    style={{ backgroundColor: `${color?.hex}dd` }}
                  >
                    {color?.name}
                  </div>

                  {/* Photo Info */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-[#FF8A65] to-[#9575CD] flex items-center justify-center text-white font-bold">
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
                        <p className="font-bold text-lg">{photo.username}</p>
                        <p className="text-sm opacity-90 flex items-center gap-1">
                          📍 {photo.location}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Bar */}
                <div className="p-5 bg-white">
                  <div className="flex items-center justify-around">
                    <button
                      type="button"
                      onClick={() => handleSwipe('left')}
                      className="w-14 h-14 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                    >
                      <X className="w-7 h-7 text-gray-600" />
                    </button>

                    <button
                      type="button"
                      className="w-16 h-16 rounded-full bg-[#FF8A65] hover:bg-[#FF8A65]/90 flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-lg"
                    >
                      <Heart className="w-8 h-8 text-white fill-white" />
                    </button>

                    <button
                      type="button"
                      className="w-14 h-14 rounded-full bg-[#FFD54F] hover:bg-[#FFD54F]/90 flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-md"
                    >
                      <Star className="w-7 h-7 text-white fill-white" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSwipe('right')}
                      className="w-14 h-14 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                    >
                      <Info className="w-7 h-7 text-gray-600" />
                    </button>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-center gap-6 mt-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      {photo.likes}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4" />
                      {photo.comments}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="w-4 h-4" />
                      {photo.favorites}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Progress Indicator */}
      <div className="absolute -bottom-8 left-0 right-0 flex justify-center gap-1.5">
        {photos.slice(0, Math.min(photos.length, 10)).map((photo, index) => (
          <div
            key={photo.id}
            className={`h-1.5 rounded-full transition-all ${
              index === currentIndex % photos.length ? 'w-8 bg-[#2D2520]' : 'w-1.5 bg-gray-300'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
