import { Link } from 'react-router';
import { Header } from '../components/Header';
import { RAINBOW_COLORS, RARE_COLORS, MOCK_PHOTOS, MOCK_USER } from '../data/mockData';
import { Lock, Search, Sparkles, Grid3x3, Map as MapIcon, MapPin, Navigation as NavigationIcon, Locate, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '../components/ui/badge';

export function Galleries() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const getPhotoCount = (colorId: string) => {
    return MOCK_PHOTOS.filter(p => p.color === colorId).length;
  };

  const allColors = [...RAINBOW_COLORS, ...RARE_COLORS];
  const filteredColors = allColors.filter(color => {
    const matchesSearch = color.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterCategory === 'all' || color.category === filterCategory;
    const matchesUnlocked = color.unlocked || MOCK_USER.level >= (color as any).requiredLevel;
    return matchesSearch && matchesFilter && matchesUnlocked;
  });

  // Group photos by location for map view
  const photoLocations = MOCK_PHOTOS.reduce((acc, photo) => {
    const key = `${photo.lat},${photo.lng}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(photo);
    return acc;
  }, {} as Record<string, typeof MOCK_PHOTOS>);

  const selectedPhotoData = selectedPhoto 
    ? MOCK_PHOTOS.find(p => p.id === selectedPhoto)
    : null;

  const categories = ['all', 'WARM', 'COOL', 'EARTH', 'NEUTRAL', 'RARE'];
  const categoryColors: Record<string, string> = {
    all: 'bg-[#2D2520] text-white',
    WARM: 'bg-[#FF8A65] text-white',
    COOL: 'bg-[#4DB6AC] text-white',
    RARE: 'bg-[#9575CD] text-white',
    NEUTRAL: 'bg-[#FFD54F] text-[#2D2520]',
    EARTH: 'bg-[#8BA888] text-white',
  };

  return (
    <div className="min-h-screen bg-[#F5F1ED] pb-24">
      <Header title="" />
      
      <div className="max-w-screen-xl mx-auto px-4 pt-16">
        {/* Brand Header */}
        <div className="mb-6 animate-fade-in">
          <h1 className="text-3xl mb-1">
            <span className="font-semibold">Chroma</span>
            <span className="italic" style={{ fontFamily: 'var(--font-brand-serif)' }}>Walk</span>
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
              {viewMode === 'grid' ? 'Color' : 'Map'} <span className="italic" style={{ fontFamily: 'var(--font-brand-serif)' }}>
                {viewMode === 'grid' ? 'Gallery' : 'Explore'}
              </span>
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {viewMode === 'grid' 
                ? `${MOCK_PHOTOS.length} photos · ${filteredColors.length} colors`
                : `${Object.keys(photoLocations).length} locations`
              }
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-3 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-[#2D2520] text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
            >
              <Grid3x3 className="w-5 h-5" />
            </button>
            <button
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
            {categories.map((category, index) => (
              <button
                key={category}
                onClick={() => setFilterCategory(category)}
                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all transform hover:scale-105 animate-slide-up ${
                  filterCategory === category
                    ? categoryColors[category]
                    : 'bg-white text-gray-700 border border-gray-200'
                }`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {category === 'all' ? 'All colors' : category.charAt(0) + category.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        )}

        {/* GRID VIEW */}
        {viewMode === 'grid' && (
          <>
            {/* Today's Palette - Featured Section */}
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
                    <span className="text-sm text-gray-600">{RAINBOW_COLORS.slice(0, 4).length} colors</span>
                  </div>
                  <div className="flex gap-2">
                    {RAINBOW_COLORS.slice(0, 4).map((color, index) => (
                      <Link
                        key={color.id}
                        to={`/gallery/${color.id}`}
                        className="flex-1 aspect-square rounded-2xl transition-all hover:scale-105 animate-scale-in"
                        style={{ 
                          backgroundColor: color.hex,
                          animationDelay: `${index * 0.1}s`
                        }}
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
                  const samplePhoto = MOCK_PHOTOS.find(p => p.color === color.id);
                  const isLocked = !color.unlocked && MOCK_USER.level < (color as any).requiredLevel;
                  
                  return (
                    <Link
                      key={color.id}
                      to={isLocked ? '#' : `/gallery/${color.id}`}
                      className={`bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all transform hover:scale-105 hover:-translate-y-1 animate-scale-in ${
                        isLocked ? 'opacity-60' : ''
                      }`}
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <div className="aspect-square" style={{ backgroundColor: color.hex }}>
                        {samplePhoto && !isLocked && (
                          <img
                            src={samplePhoto.imageUrl}
                            alt={color.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                        {isLocked && (
                          <div className="w-full h-full flex items-center justify-center">
                            <Lock className="w-8 h-8 text-white/80" />
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h4 className="font-semibold mb-1">{color.name}</h4>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-600">
                            {isLocked ? `Level ${(color as any).requiredLevel}` : `${photoCount} photos`}
                          </p>
                          <Badge
                            className={`text-xs ${categoryColors[color.category] || 'bg-gray-100 text-gray-700'}`}
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
          <>
            {/* Map Container */}
            <div className="relative h-[450px] bg-white rounded-3xl overflow-hidden shadow-lg mb-6">
              {/* Simulated Map Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#E8DFD8] via-[#F5F1ED] to-[#E8DFD8]">
                <div className="absolute inset-0" style={{
                  backgroundImage: `repeating-linear-gradient(0deg, rgba(45, 37, 32, 0.03) 0px, rgba(45, 37, 32, 0.03) 1px, transparent 1px, transparent 50px),
                                   repeating-linear-gradient(90deg, rgba(45, 37, 32, 0.03) 0px, rgba(45, 37, 32, 0.03) 1px, transparent 1px, transparent 50px)`,
                }} />
                
                {/* Animated background circles */}
                <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-[#FF8A65]/5 rounded-full animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-[#4DB6AC]/5 rounded-full animate-pulse delay-75" />
              </div>

              {/* Photo Location Markers */}
              {Object.entries(photoLocations).map(([key, photos], index) => {
                const [lat, lng] = key.split(',').map(Number);
                const mainPhoto = photos[0];
                const color = RAINBOW_COLORS.find(c => c.id === mainPhoto.color);
                
                // Simulate positioning
                const x = 15 + (index % 6) * 14;
                const y = 15 + Math.floor(index / 6) * 22;

                return (
                  <button
                    key={key}
                    onClick={() => setSelectedPhoto(mainPhoto.id)}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all hover:scale-125 hover:z-10 animate-bounce-slow"
                    style={{ 
                      left: `${x}%`, 
                      top: `${y}%`,
                      animationDelay: `${index * 0.1}s`
                    }}
                  >
                    <div className="relative">
                      {/* Ping animation */}
                      <div 
                        className="absolute inset-0 rounded-full animate-ping opacity-75"
                        style={{ backgroundColor: color?.hex }}
                      />
                      
                      <div
                        className="relative w-14 h-14 rounded-full border-4 border-white shadow-xl overflow-hidden transform transition-transform hover:rotate-6"
                        style={{ backgroundColor: color?.hex }}
                      >
                        <img
                          src={mainPhoto.imageUrl}
                          alt={mainPhoto.location}
                          className="w-full h-full object-cover"
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

              {/* Current Location Button */}
              <button className="absolute bottom-4 right-4 bg-[#2D2520] text-white p-4 rounded-full shadow-xl hover:shadow-2xl transition-all hover:scale-110 active:scale-95">
                <Locate className="w-6 h-6" />
              </button>
              
              {/* Zoom Controls */}
              <div className="absolute bottom-4 left-4 flex flex-col gap-2">
                <button className="bg-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 active:scale-95">
                  <span className="text-xl font-bold text-[#2D2520]">+</span>
                </button>
                <button className="bg-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 active:scale-95">
                  <span className="text-xl font-bold text-[#2D2520]">−</span>
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
                      <span className="font-bold text-lg text-[#2D2520]">{selectedPhotoData.location}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      By {selectedPhotoData.username}
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1 text-[#FF8A65]">
                        ❤️ <span className="font-semibold">{selectedPhotoData.likes}</span>
                      </span>
                      <span className="flex items-center gap-1 text-[#FFD54F]">
                        ⭐ <span className="font-semibold">{selectedPhotoData.favorites}</span>
                      </span>
                      <span className="flex items-center gap-1 text-[#4DB6AC]">
                        💬 <span className="font-semibold">{selectedPhotoData.comments}</span>
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedPhoto(null)}
                    className="text-gray-400 hover:text-gray-600 transition-colors hover:rotate-90 transform duration-200"
                  >
                    <span className="text-2xl">✕</span>
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
                <span className="text-sm text-gray-600">{Object.keys(photoLocations).length} locations</span>
              </div>
              
              <div className="space-y-3">
                {Object.entries(photoLocations)
                  .sort((a, b) => b[1].length - a[1].length)
                  .slice(0, 6)
                  .map(([key, photos], index) => {
                    const mainPhoto = photos[0];
                    const color = RAINBOW_COLORS.find(c => c.id === mainPhoto.color);
                    
                    return (
                      <button
                        key={key}
                        onClick={() => setSelectedPhoto(mainPhoto.id)}
                        className="w-full bg-white rounded-2xl p-4 shadow-sm hover:shadow-lg transition-all text-left transform hover:scale-102 hover:-translate-y-1"
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <div
                              className="w-16 h-16 rounded-xl flex-shrink-0 shadow-md overflow-hidden"
                              style={{ backgroundColor: color?.hex }}
                            >
                              <img
                                src={mainPhoto.imageUrl}
                                alt={mainPhoto.location}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div 
                              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white shadow-sm"
                              style={{ backgroundColor: color?.hex }}
                            />
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-[#2D2520] mb-1">{mainPhoto.location}</p>
                            <p className="text-sm text-gray-600">{photos.length} color {photos.length === 1 ? 'photo' : 'photos'}</p>
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
                  <p className="text-3xl font-bold mb-1">{Object.keys(photoLocations).length}</p>
                  <p className="text-sm opacity-90">Locations discovered</p>
                </div>
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <MapPin className="w-8 h-8" />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}