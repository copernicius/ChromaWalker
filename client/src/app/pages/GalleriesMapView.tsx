import { Locate, MapPin, TrendingUp } from 'lucide-react';
import { memo } from 'react';
import { LazyImage } from '../components/LazyImage';
import type { Photo } from '../data/mockData';
import { RAINBOW_COLORS } from '../data/mockData';

interface PhotoLocation {
  key: string;
  photos: Photo[];
}

interface GalleriesMapViewProps {
  photoLocations: Record<string, Photo[]>;
  selectedPhotoData: Photo | undefined;
  onSelectPhoto: (id: string) => void;
  onClearSelection: () => void;
}

export const GalleriesMapView = memo(
  ({
    photoLocations,
    selectedPhotoData,
    onSelectPhoto,
    onClearSelection,
  }: GalleriesMapViewProps) => {
    const locationEntries: PhotoLocation[] = Object.entries(photoLocations).map(
      ([key, photos]) => ({ key, photos }),
    );

    return (
      <>
        {/* Map Container */}
        <div className="relative h-[450px] bg-white rounded-3xl overflow-hidden shadow-lg mb-6">
          {/* Simulated Map Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#E8DFD8] via-[#F5F1ED] to-[#E8DFD8]">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `repeating-linear-gradient(0deg, rgba(45, 37, 32, 0.03) 0px, rgba(45, 37, 32, 0.03) 1px, transparent 1px, transparent 50px),
                             repeating-linear-gradient(90deg, rgba(45, 37, 32, 0.03) 0px, rgba(45, 37, 32, 0.03) 1px, transparent 1px, transparent 50px)`,
              }}
            />
            <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-[#FF8A65]/5 rounded-full animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-[#4DB6AC]/5 rounded-full animate-pulse delay-75" />
          </div>

          {/* Photo Location Markers */}
          {locationEntries.map(({ key, photos }, index) => {
            const mainPhoto = photos[0];
            const color = RAINBOW_COLORS.find((c) => c.id === mainPhoto.color);
            const x = 15 + (index % 6) * 14;
            const y = 15 + Math.floor(index / 6) * 22;

            return (
              <button
                type="button"
                key={key}
                onClick={() => onSelectPhoto(mainPhoto.id)}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all hover:scale-125 hover:z-10 animate-bounce-slow"
                style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${index * 0.1}s` }}
              >
                <div className="relative">
                  <div
                    className="absolute inset-0 rounded-full animate-ping opacity-75"
                    style={{ backgroundColor: color?.hex }}
                  />
                  <div
                    className="relative w-14 h-14 rounded-full border-4 border-white shadow-xl overflow-hidden transform transition-transform hover:rotate-6"
                    style={{ backgroundColor: color?.hex }}
                  >
                    <LazyImage
                      src={mainPhoto.imageUrl}
                      alt={mainPhoto.location}
                      className="w-full h-full"
                    />
                  </div>
                  {photos.length > 1 && (
                    <div className="absolute -top-1 -right-1 bg-[#2D2520] text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-md animate-pulse">
                      {photos.length}
                    </div>
                  )}
                </div>
              </button>
            );
          })}

          <button
            type="button"
            className="absolute bottom-4 right-4 bg-[#2D2520] text-white p-4 rounded-full shadow-xl hover:shadow-2xl transition-all hover:scale-110 active:scale-95"
          >
            <Locate className="w-6 h-6" />
          </button>
          <div className="absolute bottom-4 left-4 flex flex-col gap-2">
            <button
              type="button"
              className="bg-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 active:scale-95"
            >
              <span className="text-xl font-bold text-[#2D2520]">+</span>
            </button>
            <button
              type="button"
              className="bg-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 active:scale-95"
            >
              <span className="text-xl font-bold text-[#2D2520]">-</span>
            </button>
          </div>
        </div>

        {/* Photo Details Card */}
        {selectedPhotoData && (
          <div className="bg-white rounded-3xl p-5 shadow-lg mb-6 animate-slide-up">
            <div className="flex gap-4">
              <img
                src={selectedPhotoData.imageUrl}
                alt={selectedPhotoData.location}
                className="w-28 h-28 rounded-2xl object-cover shadow-md"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-5 h-5 text-[#C89F7B]" />
                  <span className="font-bold text-lg text-[#2D2520]">
                    {selectedPhotoData.location}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">By {selectedPhotoData.username}</p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="font-semibold">{selectedPhotoData.likes} likes</span>
                  <span className="font-semibold">{selectedPhotoData.favorites} favorites</span>
                  <span className="font-semibold">{selectedPhotoData.comments} comments</span>
                </div>
              </div>
              <button
                type="button"
                onClick={onClearSelection}
                className="text-gray-400 hover:text-gray-600 transition-colors hover:rotate-90 transform duration-200"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>
          </div>
        )}

        {/* Popular Locations */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#C89F7B]" />
              Popular Spots
            </h2>
            <span className="text-sm text-gray-600">{locationEntries.length} locations</span>
          </div>
          <div className="space-y-3">
            {locationEntries
              .sort((a, b) => b.photos.length - a.photos.length)
              .slice(0, 6)
              .map(({ key, photos }, index) => {
                const mainPhoto = photos[0];
                const color = RAINBOW_COLORS.find((c) => c.id === mainPhoto.color);
                return (
                  <button
                    type="button"
                    key={key}
                    onClick={() => onSelectPhoto(mainPhoto.id)}
                    className="w-full bg-white rounded-2xl p-4 shadow-sm hover:shadow-lg transition-all text-left transform hover:scale-102 hover:-translate-y-1"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div
                          className="w-16 h-16 rounded-xl flex-shrink-0 shadow-md overflow-hidden"
                          style={{ backgroundColor: color?.hex }}
                        >
                          <LazyImage
                            src={mainPhoto.imageUrl}
                            alt={mainPhoto.location}
                            className="w-full h-full"
                          />
                        </div>
                        <div
                          className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white shadow-sm"
                          style={{ backgroundColor: color?.hex }}
                        />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-[#2D2520] mb-1">{mainPhoto.location}</p>
                        <p className="text-sm text-gray-600">
                          {photos.length} color {photos.length === 1 ? 'photo' : 'photos'}
                        </p>
                      </div>
                      <MapPin className="w-5 h-5 text-[#C89F7B]" />
                    </div>
                  </button>
                );
              })}
          </div>
        </div>

        {/* Stats Card */}
        <div className="bg-gradient-to-br from-[#FF8A65] to-[#9575CD] rounded-3xl p-6 text-white shadow-lg">
          <h3 className="text-sm uppercase tracking-wide opacity-90 mb-2">Your Exploration</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold mb-1">{locationEntries.length}</p>
              <p className="text-sm opacity-90">Locations discovered</p>
            </div>
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <MapPin className="w-8 h-8" />
            </div>
          </div>
        </div>
      </>
    );
  },
);

GalleriesMapView.displayName = 'GalleriesMapView';
