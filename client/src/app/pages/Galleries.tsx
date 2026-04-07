import { Grid3x3, Lock, Map as MapIcon, Search, Sparkles } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Header } from '../components/Header';
import { LazyImage } from '../components/LazyImage';
import { Badge } from '../components/ui/badge';
import { MOCK_PHOTOS, MOCK_USER, RAINBOW_COLORS, RARE_COLORS, isRareColor } from '../data/mockData';
import type { AnyColor } from '../data/mockData';
import { GalleriesMapView } from './GalleriesMapView';

const CATEGORIES = ['all', 'WARM', 'COOL', 'EARTH', 'NEUTRAL', 'RARE'] as const;

const CATEGORY_COLORS: Record<string, string> = {
  all: 'bg-[#2D2520] text-white',
  WARM: 'bg-[#FF8A65] text-white',
  COOL: 'bg-[#4DB6AC] text-white',
  RARE: 'bg-[#9575CD] text-white',
  NEUTRAL: 'bg-[#FFD54F] text-[#2D2520]',
  EARTH: 'bg-[#8BA888] text-white',
};

const isColorLocked = (color: AnyColor, userLevel: number): boolean =>
  !color.unlocked && isRareColor(color) && userLevel < color.requiredLevel;

export const Galleries = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const allColors: AnyColor[] = useMemo(() => [...RAINBOW_COLORS, ...RARE_COLORS], []);

  const filteredColors = useMemo(
    () =>
      allColors.filter((color) => {
        const matchesSearch = color.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filterCategory === 'all' || color.category === filterCategory;
        const matchesUnlocked =
          color.unlocked || (isRareColor(color) && MOCK_USER.level >= color.requiredLevel);
        return matchesSearch && matchesFilter && matchesUnlocked;
      }),
    [allColors, searchQuery, filterCategory],
  );

  const photoLocations = useMemo(
    () =>
      MOCK_PHOTOS.reduce(
        (acc, photo) => {
          const key = `${photo.lat},${photo.lng}`;
          if (!acc[key]) acc[key] = [];
          acc[key].push(photo);
          return acc;
        },
        {} as Record<string, typeof MOCK_PHOTOS>,
      ),
    [],
  );

  const selectedPhotoData = useMemo(
    () => (selectedPhoto ? MOCK_PHOTOS.find((p) => p.id === selectedPhoto) : undefined),
    [selectedPhoto],
  );

  const getPhotoCount = useCallback(
    (colorId: string) => MOCK_PHOTOS.filter((p) => p.color === colorId).length,
    [],
  );

  const handleSelectPhoto = useCallback((id: string) => setSelectedPhoto(id), []);
  const handleClearSelection = useCallback(() => setSelectedPhoto(null), []);

  return (
    <div className="min-h-screen bg-[#F5F1ED] pb-24">
      <div className="max-w-screen-xl mx-auto px-4 pt-6">
        {/* Brand Header */}
        <div className="mb-6 animate-fade-in">
          <h1 className="text-3xl mb-1">
            <span className="font-semibold">Chroma</span>
            <span className="italic" style={{ fontFamily: 'var(--font-brand-serif)' }}>
              Walk
            </span>
          </h1>
        </div>

        {/* Search Bar */}
        <div className="mb-6 animate-slide-up">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Explore colors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2D2520]/20 transition-all"
            />
          </div>
        </div>

        {/* Page Title & View Toggle */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl">
              {viewMode === 'grid' ? 'Color' : 'Map'}{' '}
              <span className="italic" style={{ fontFamily: 'var(--font-brand-serif)' }}>
                {viewMode === 'grid' ? 'Gallery' : 'Explore'}
              </span>
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {viewMode === 'grid'
                ? `${MOCK_PHOTOS.length} photos · ${filteredColors.length} colors`
                : `${Object.keys(photoLocations).length} locations`}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-3 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-[#2D2520] text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
            >
              <Grid3x3 className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('map')}
              className={`p-3 rounded-xl transition-all ${viewMode === 'map' ? 'bg-[#2D2520] text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
            >
              <MapIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Category Filters */}
        {viewMode === 'grid' && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
            {CATEGORIES.map((category, index) => (
              <button
                type="button"
                key={category}
                onClick={() => setFilterCategory(category)}
                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all transform hover:scale-105 animate-slide-up ${
                  filterCategory === category
                    ? CATEGORY_COLORS[category]
                    : 'bg-white text-gray-700 border border-gray-200'
                }`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {category === 'all'
                  ? 'All colors'
                  : category.charAt(0) + category.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        )}

        {/* GRID VIEW */}
        {viewMode === 'grid' && (
          <>
            {/* Today's Palette */}
            <div className="mb-8 animate-scale-in">
              <div className="bg-gradient-to-br from-[#FF8A65] via-[#9575CD] to-[#FFD54F] p-1 rounded-3xl">
                <div className="bg-white rounded-3xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-xs text-gray-600 uppercase tracking-wide mb-1 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-[#FFD54F]" />
                        Featured
                      </p>
                      <h3 className="text-xl font-semibold">Today's Palette</h3>
                    </div>
                    <span className="text-sm text-gray-600">
                      {RAINBOW_COLORS.slice(0, 4).length} colors
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {RAINBOW_COLORS.slice(0, 4).map((color, index) => (
                      <Link
                        key={color.id}
                        to={`/gallery/${color.id}`}
                        className="flex-1 aspect-square rounded-2xl transition-all hover:scale-105 animate-scale-in"
                        style={{ backgroundColor: color.hex, animationDelay: `${index * 0.1}s` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Color Galleries Grid */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Color Galleries</h3>
                <span className="text-sm text-gray-600">{filteredColors.length} available</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {filteredColors.map((color, index) => {
                  const photoCount = getPhotoCount(color.id);
                  const samplePhoto = MOCK_PHOTOS.find((p) => p.color === color.id);
                  const locked = isColorLocked(color, MOCK_USER.level);

                  return (
                    <Link
                      key={color.id}
                      to={locked ? '#' : `/gallery/${color.id}`}
                      className={`bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all transform hover:scale-105 hover:-translate-y-1 animate-scale-in ${
                        locked ? 'opacity-60' : ''
                      }`}
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <div className="aspect-square" style={{ backgroundColor: color.hex }}>
                        {samplePhoto && !locked && (
                          <LazyImage
                            src={samplePhoto.imageUrl}
                            alt={color.name}
                            className="w-full h-full"
                          />
                        )}
                        {locked && (
                          <div className="w-full h-full flex items-center justify-center">
                            <Lock className="w-8 h-8 text-white/80" />
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h4 className="font-semibold mb-1">{color.name}</h4>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-600">
                            {locked && isRareColor(color)
                              ? `Level ${color.requiredLevel}`
                              : `${photoCount} photos`}
                          </p>
                          <Badge
                            className={`text-xs ${CATEGORY_COLORS[color.category] || 'bg-gray-100 text-gray-700'}`}
                          >
                            {color.category}
                          </Badge>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* MAP VIEW */}
        {viewMode === 'map' && (
          <GalleriesMapView
            photoLocations={photoLocations}
            selectedPhotoData={selectedPhotoData}
            onSelectPhoto={handleSelectPhoto}
            onClearSelection={handleClearSelection}
          />
        )}
      </div>
    </div>
  );
};
