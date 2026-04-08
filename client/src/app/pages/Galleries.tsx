import {
  ArrowDownUp,
  Camera,
  Grid3x3,
  Locate,
  Lock,
  Map as MapIcon,
  MapPin,
  Palette,
  TrendingUp,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { PhotoCard } from '../components/PhotoCard';
import { PhotoDetail } from '../components/PhotoDetail';
import { MOCK_PHOTOS, RAINBOW_COLORS, RARE_COLORS } from '../data/mockData';

export function Galleries() {
  const [_searchQuery, _setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [selectedColorFilter, setSelectedColorFilter] = useState<string | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [mapZoom, setMapZoom] = useState<'normal' | 'zoomed'>('normal');
  const [zoomedLocation, setZoomedLocation] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'recent' | 'popular'>('recent');
  const [showMyPhotos, setShowMyPhotos] = useState(false);

  const getPhotoCount = (colorId: string) => {
    return MOCK_PHOTOS.filter((p) => p.color === colorId).length;
  };

  // Group photos by location for map view
  const photoLocations = MOCK_PHOTOS.reduce(
    (acc, photo) => {
      const key = `${photo.lat},${photo.lng}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(photo);
      return acc;
    },
    {} as Record<string, typeof MOCK_PHOTOS>,
  );

  const selectedPhotoData = selectedPhoto ? MOCK_PHOTOS.find((p) => p.id === selectedPhoto) : null;

  // Get nearby photos when zoomed in
  const getNearbyPhotos = (locationKey: string) => {
    const [targetLat, targetLng] = locationKey.split(',').map(Number);
    return MOCK_PHOTOS.filter((photo) => {
      const distance = Math.sqrt((photo.lat - targetLat) ** 2 + (photo.lng - targetLng) ** 2);
      return distance < 0.01; // Within ~1km radius simulation
    });
  };

  // Get nearby locations when zoomed in
  const getNearbyLocations = (locationKey: string) => {
    const [targetLat, targetLng] = locationKey.split(',').map(Number);
    return Object.entries(photoLocations)
      .filter(([key, _photos]) => {
        const [lat, lng] = key.split(',').map(Number);
        const distance = Math.sqrt((lat - targetLat) ** 2 + (lng - targetLng) ** 2);
        return distance < 0.015 && key !== locationKey; // Within ~1.5km radius
      })
      .sort((a, b) => b[1].length - a[1].length) // Sort by photo count
      .slice(0, 4); // Top 4 nearby locations
  };

  const handleLocationClick = (locationKey: string) => {
    setZoomedLocation(locationKey);
    setMapZoom('zoomed');
    setShowMyPhotos(false);
  };

  const handleZoomOut = () => {
    setMapZoom('normal');
    setZoomedLocation(null);
    setShowMyPhotos(false);
  };

  const handleExplorationClick = () => {
    setShowMyPhotos(true);
    setMapZoom('zoomed');
    setZoomedLocation(null);
  };

  // Filter photos by color when selected
  let filteredPhotos = selectedColorFilter
    ? MOCK_PHOTOS.filter((p) => p.color === selectedColorFilter)
    : MOCK_PHOTOS;

  // Filter by my photos (first 3 for demo)
  const myPhotos = MOCK_PHOTOS.slice(0, 3);

  if (showMyPhotos) {
    filteredPhotos = myPhotos;
  }

  // Sort photos
  const sortedPhotos = [...filteredPhotos].sort((a, b) => {
    if (sortBy === 'popular') {
      const scoreA = a.likes + a.favorites * 2;
      const scoreB = b.likes + b.favorites * 2;
      return scoreB - scoreA;
    }
    return b.timestamp.getTime() - a.timestamp.getTime();
  });

  // Reduced default colors - only show first 3 collected colors
  const collectedColors = RAINBOW_COLORS.filter((color) => getPhotoCount(color.id) > 0).slice(0, 3);

  // All colors for picker modal
  const allPickerColors = [...RAINBOW_COLORS, ...RARE_COLORS];

  return (
    <div className="min-h-screen bg-[#F5F1ED] pb-24">
      <div className="max-w-screen-xl mx-auto px-4 pt-4">
        {/* Brand Header */}
        <div className="mb-4 animate-fade-in">
          <h1 className="text-3xl mb-1">
            <span className="font-semibold">Color </span>
            <span className="italic" style={{ fontFamily: 'var(--font-brand-serif)' }}>
              Gallery
            </span>
          </h1>
          <p className="text-sm text-gray-600">
            {selectedColorFilter
              ? `${filteredPhotos.length} photos · ${allPickerColors.find((c) => c.id === selectedColorFilter)?.name || 'All'}`
              : `${MOCK_PHOTOS.length} photos`}
          </p>
        </div>

        {/* Single Line: Colors + Color Picker + Sort + View Toggle */}
        <div className="flex items-center gap-2 mb-6">
          {/* All colors button - Always visible */}
          <button
            type="button"
            onClick={() => setSelectedColorFilter(null)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm whitespace-nowrap transition-all flex-shrink-0 ${
              selectedColorFilter === null
                ? 'bg-[#2D2520] text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            All
          </button>

          {/* Reduced collected color buttons (only 3) - Hidden on mobile */}
          {collectedColors.map((color) => (
            <button
              type="button"
              key={color.id}
              onClick={() => setSelectedColorFilter(color.id)}
              className={`hidden md:flex items-center gap-1.5 px-3 py-2 rounded-full text-sm whitespace-nowrap transition-all flex-shrink-0 ${
                selectedColorFilter === color.id
                  ? 'bg-white ring-2 ring-[#2D2520] ring-offset-2 shadow-md'
                  : 'bg-white hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <div
                className="w-4 h-4 rounded-full shadow-sm flex-shrink-0"
                style={{ backgroundColor: color.hex }}
              />
              <span className="text-gray-700 font-medium">{color.name}</span>
            </button>
          ))}

          {/* Color Picker button - Always visible */}
          <button
            type="button"
            onClick={() => setShowColorPicker(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full text-sm whitespace-nowrap transition-all flex-shrink-0 bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
          >
            <Palette className="w-4 h-4 text-[#C89F7B]" />
            <span className="font-medium">Color Picker</span>
          </button>

          {/* Spacer to push right items - Always pushes to right */}
          <div className="flex-1" />

          {/* Sort dropdown - Icon only on mobile, full on desktop */}
          <div className="relative flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-gray-200 flex-shrink-0">
            <ArrowDownUp className="w-4 h-4 text-gray-600" />
            {/* Desktop - show text */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'recent' | 'popular')}
              className="hidden sm:block text-sm bg-transparent border-none outline-none text-gray-700 cursor-pointer"
            >
              <option value="recent">Recent</option>
              <option value="popular">Popular</option>
            </select>
            {/* Mobile - invisible select that covers the button area */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'recent' | 'popular')}
              className="sm:hidden absolute left-0 top-0 w-full h-full opacity-0 cursor-pointer"
            >
              <option value="recent">Recent</option>
              <option value="popular">Popular</option>
            </select>
          </div>

          {/* View Toggle - Always visible, always on right */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-2.5 rounded-xl transition-all ${
                viewMode === 'grid'
                  ? 'bg-[#2D2520] text-white'
                  : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('map')}
              className={`p-2.5 rounded-xl transition-all ${
                viewMode === 'map'
                  ? 'bg-[#2D2520] text-white'
                  : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              <MapIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* GRID VIEW */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            {sortedPhotos.map((photo, index) => (
              <div
                key={photo.id}
                className="animate-scale-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <PhotoCard photo={photo} onClick={() => setSelectedPhoto(photo.id)} />
              </div>
            ))}
          </div>
        )}

        {/* MAP VIEW */}
        {viewMode === 'map' && (
          <>
            {/* Map Container */}
            <div className="relative h-[450px] bg-white rounded-3xl overflow-hidden shadow-lg mb-6">
              {/* Simulated Map Background */}
              <div
                className={`absolute inset-0 bg-gradient-to-br from-[#E8DFD8] via-[#F5F1ED] to-[#E8DFD8] transition-all duration-500 ${
                  mapZoom === 'zoomed' ? 'scale-150' : 'scale-100'
                }`}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `repeating-linear-gradient(0deg, rgba(45, 37, 32, 0.03) 0px, rgba(45, 37, 32, 0.03) 1px, transparent 1px, transparent 50px),
                                   repeating-linear-gradient(90deg, rgba(45, 37, 32, 0.03) 0px, rgba(45, 37, 32, 0.03) 1px, transparent 1px, transparent 50px)`,
                  }}
                />

                {/* Animated background circles */}
                <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-[#FF8A65]/5 rounded-full animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-[#4DB6AC]/5 rounded-full animate-pulse delay-75" />
              </div>

              {/* Normal Zoom - Location Markers */}
              {mapZoom === 'normal' &&
                Object.entries(photoLocations).map(([key, photos], index) => {
                  const [_lat, _lng] = key.split(',').map(Number);
                  const mainPhoto = photos[0];
                  const color = RAINBOW_COLORS.find((c) => c.id === mainPhoto.color);

                  // Simulate positioning
                  const x = 15 + (index % 6) * 14;
                  const y = 15 + Math.floor(index / 6) * 22;

                  return (
                    <button
                      type="button"
                      key={key}
                      onClick={() => handleLocationClick(key)}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all hover:scale-125 hover:z-10 animate-bounce-slow"
                      style={{
                        left: `${x}%`,
                        top: `${y}%`,
                        animationDelay: `${index * 0.1}s`,
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

              {/* Zoomed View - Individual Photo Tags (when clicking location) */}
              {mapZoom === 'zoomed' && zoomedLocation && !showMyPhotos && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative w-full h-full flex items-center justify-center">
                    {getNearbyPhotos(zoomedLocation).map((photo, index) => {
                      const color = RAINBOW_COLORS.find((c) => c.id === photo.color);
                      const angle = (index / getNearbyPhotos(zoomedLocation).length) * 2 * Math.PI;
                      const radius = 120;
                      const x = 50 + Math.cos(angle) * radius;
                      const y = 50 + Math.sin(angle) * radius;

                      return (
                        <button
                          type="button"
                          key={photo.id}
                          onClick={() => setSelectedPhoto(photo.id)}
                          className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all hover:scale-125 hover:z-10 animate-scale-in"
                          style={{
                            left: `${x}px`,
                            top: `${y}px`,
                            animationDelay: `${index * 0.1}s`,
                          }}
                        >
                          <div className="relative">
                            <div
                              className="w-20 h-20 rounded-2xl border-4 border-white shadow-2xl overflow-hidden transform transition-transform hover:rotate-6"
                              style={{ backgroundColor: color?.hex }}
                            >
                              <img
                                src={photo.imageUrl}
                                alt={photo.location}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div
                              className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full border-2 border-white shadow-md"
                              style={{ backgroundColor: color?.hex }}
                            />
                          </div>
                        </button>
                      );
                    })}

                    {/* Center Location Marker */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <MapPin className="w-12 h-12 text-[#C89F7B] drop-shadow-lg animate-bounce" />
                    </div>
                  </div>
                </div>
              )}

              {/* Zoomed View - My Photos (when clicking "Your Exploration") */}
              {mapZoom === 'zoomed' && showMyPhotos && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative w-full h-full flex items-center justify-center">
                    {myPhotos.map((photo, index) => {
                      const color = RAINBOW_COLORS.find((c) => c.id === photo.color);
                      const angle = (index / myPhotos.length) * 2 * Math.PI;
                      const radius = 100;
                      const x = 50 + Math.cos(angle) * radius;
                      const y = 50 + Math.sin(angle) * radius;

                      return (
                        <button
                          type="button"
                          key={photo.id}
                          onClick={() => setSelectedPhoto(photo.id)}
                          className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all hover:scale-125 hover:z-10 animate-scale-in"
                          style={{
                            left: `${x}px`,
                            top: `${y}px`,
                            animationDelay: `${index * 0.1}s`,
                          }}
                        >
                          <div className="relative">
                            <div
                              className="w-20 h-20 rounded-2xl border-4 border-white shadow-2xl overflow-hidden transform transition-transform hover:rotate-6"
                              style={{ backgroundColor: color?.hex }}
                            >
                              <img
                                src={photo.imageUrl}
                                alt={photo.location}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div
                              className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full border-2 border-white shadow-md"
                              style={{ backgroundColor: color?.hex }}
                            />
                          </div>
                        </button>
                      );
                    })}

                    {/* Center Camera Icon */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#2D2520] rounded-full p-4">
                      <Camera className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </div>
              )}

              {/* Back Button when Zoomed */}
              {mapZoom === 'zoomed' && (
                <button
                  type="button"
                  onClick={handleZoomOut}
                  className="absolute top-4 left-4 bg-[#2D2520] text-white px-4 py-2 rounded-full shadow-xl hover:shadow-2xl transition-all hover:scale-110 active:scale-95 flex items-center gap-2 z-20"
                >
                  <X className="w-5 h-5" />
                  Back to Map
                </button>
              )}

              {/* Current Location Button */}
              <button
                type="button"
                className="absolute bottom-4 right-4 bg-[#2D2520] text-white p-4 rounded-full shadow-xl hover:shadow-2xl transition-all hover:scale-110 active:scale-95"
              >
                <Locate className="w-6 h-6" />
              </button>

              {/* Zoom Controls */}
              {mapZoom === 'normal' && (
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
                    <span className="text-xl font-bold text-[#2D2520]">−</span>
                  </button>
                </div>
              )}
            </div>

            {/* Popular Locations - Always visible, filtered when zoomed */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#C89F7B]" />
                  {mapZoom === 'zoomed' && zoomedLocation
                    ? 'Nearby Popular Spots'
                    : 'Popular Spots'}
                </h2>
                <span className="text-sm text-gray-600">
                  {mapZoom === 'zoomed' && zoomedLocation
                    ? `${getNearbyLocations(zoomedLocation).length} nearby`
                    : `${Object.keys(photoLocations).length} locations`}
                </span>
              </div>

              <div className="space-y-3">
                {(mapZoom === 'zoomed' && zoomedLocation
                  ? getNearbyLocations(zoomedLocation)
                  : Object.entries(photoLocations)
                      .sort((a, b) => b[1].length - a[1].length)
                      .slice(0, 6)
                ).map(([key, photos], index) => {
                  const mainPhoto = photos[0];
                  const color = RAINBOW_COLORS.find((c) => c.id === mainPhoto.color);

                  return (
                    <button
                      type="button"
                      key={key}
                      onClick={() => handleLocationClick(key)}
                      className="w-full bg-white rounded-2xl p-4 shadow-sm hover:shadow-lg transition-all text-left transform hover:scale-102 hover:-translate-y-1 animate-slide-up"
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

            {/* Your Exploration Card - Always visible */}
            <button
              type="button"
              onClick={handleExplorationClick}
              className="w-full bg-gradient-to-br from-[#FF8A65] to-[#9575CD] rounded-3xl p-6 text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
            >
              <h3 className="text-sm uppercase tracking-wide opacity-90 mb-2">Your Exploration</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold mb-1">{myPhotos.length}</p>
                  <p className="text-sm opacity-90">Photos uploaded</p>
                </div>
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <Camera className="w-8 h-8" />
                </div>
              </div>
            </button>
          </>
        )}
      </div>

      {/* Color Picker Modal */}
      {showColorPicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl animate-scale-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#4DB6AC] to-[#9575CD] flex items-center justify-center">
                  <Palette className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#2D2520]">Color Picker</h2>
                  <p className="text-sm text-gray-600">Choose a color to filter photos</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowColorPicker(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Color Grid - 4 columns like reference */}
            <div className="grid grid-cols-4 gap-3">
              {allPickerColors.map((color, index) => {
                const count = getPhotoCount(color.id);
                const isCollected = count > 0;

                return (
                  <button
                    type="button"
                    key={color.id}
                    onClick={() => {
                      setSelectedColorFilter(color.id);
                      setShowColorPicker(false);
                    }}
                    className={`relative transition-all hover:scale-105 active:scale-95 animate-scale-in ${
                      selectedColorFilter === color.id ? 'ring-4 ring-[#2D2520] ring-offset-2' : ''
                    } ${!isCollected ? 'opacity-40' : ''}`}
                    style={{ animationDelay: `${index * 0.03}s` }}
                  >
                    <div
                      className="aspect-square rounded-2xl shadow-md relative overflow-hidden"
                      style={{ backgroundColor: color.hex }}
                    >
                      {!isCollected && (
                        <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                          <Lock className="w-5 h-5 text-white/70" />
                        </div>
                      )}
                    </div>
                    {isCollected && count > 0 && (
                      <div className="absolute -top-1.5 -right-1.5 bg-[#2D2520] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-md">
                        {count}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Photo Detail Modal */}
      {selectedPhotoData && (
        <PhotoDetail photo={selectedPhotoData} onClose={() => setSelectedPhoto(null)} />
      )}
    </div>
  );
}
