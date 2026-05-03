import {
  Camera,
  Clock,
  Grid3x3,
  Lock,
  Map as MapIcon,
  Palette,
  TrendingUp,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { PhotoCard, PhotoDetail, PhotoMap } from '../components';
import { getPaletteColor, type Photo } from '../data';
import {
  useMyUnlockedColorsQuery,
  usePaletteQuery,
  usePhotosQuery,
} from '../queries';

export function Galleries() {
  const [_searchQuery, _setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');

  // selectedPhoto is URL-driven so deep links (?photo=:id) auto-open the
  // modal and the browser back button closes it.
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedPhoto = searchParams.get('photo');
  const setSelectedPhoto = useCallback(
    (id: string | null) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (id) next.set('photo', id);
          else next.delete('photo');
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const [selectedColorFilter, setSelectedColorFilter] = useState<string | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'popular'>('recent');
  const { data: allPhotos = [] } = usePhotosQuery();
  const { data: palette } = usePaletteQuery();
  const { data: unlockedColorIds } = useMyUnlockedColorsQuery();

  // Visibility gate: signed-in users only see photos in colors they've
  // unlocked (= ever uploaded a photo of). When `data` is `undefined`
  // (signed out / still loading) we don't filter — keeps the gallery
  // browsable for unauthenticated visitors and avoids a flash of empty.
  const unlockedSet = useMemo(
    () => (unlockedColorIds === undefined ? null : new Set(unlockedColorIds)),
    [unlockedColorIds],
  );
  const visiblePhotos = useMemo(
    () =>
      unlockedSet === null
        ? allPhotos
        : allPhotos.filter((p) => unlockedSet.has(p.color)),
    [allPhotos, unlockedSet],
  );

  const getPhotoCount = (colorId: string) => {
    return visiblePhotos.filter((p) => p.color === colorId).length;
  };

  // Aggregate photos by location *name* so Popular Spots dedupes when pins
  // sit a few meters apart at the same place. Spot rank = sum of
  // (likes + favorites) across all photos at that spot; photos within a
  // spot are pre-sorted by weight so top-N slicing is trivial.
  const popularSpots = useMemo(() => {
    const photoWeight = (p: Photo) => p.likes + p.favorites;

    const byName = new Map<string, Photo[]>();
    for (const photo of visiblePhotos) {
      if (!photo.location) continue;
      const list = byName.get(photo.location) ?? [];
      list.push(photo);
      byName.set(photo.location, list);
    }
    return Array.from(byName.entries())
      .map(([name, photos]) => {
        const sorted = [...photos].sort(
          (a, b) => photoWeight(b) - photoWeight(a),
        );
        const totalWeight = sorted.reduce((sum, p) => sum + photoWeight(p), 0);
        return { name, photos: sorted, mainPhoto: sorted[0], totalWeight };
      })
      .sort((a, b) => b.totalWeight - a.totalWeight);
  }, [visiblePhotos]);

  // Coords to pan the map to when a Popular Spot row is tapped. New object
  // identity per click so PhotoMap's effect re-fires on repeat clicks too.
  const [centerOn, setCenterOn] = useState<{ lat: number; lng: number } | null>(null);
  // Spot name whose top-N photos are shown in the strip below the map.
  // Drives a separate render path from `centerOn` so the strip can update
  // independently (e.g. open / browse without re-panning).
  const [selectedSpotName, setSelectedSpotName] = useState<string | null>(null);

  // Auto-center on the most popular spot the first time it's available.
  // Ref-guarded so we don't re-pan if popularSpots changes later (e.g. after
  // a new upload), which would yank the map out from under the user.
  const autoCenteredRef = useRef(false);
  useEffect(() => {
    if (autoCenteredRef.current) return;
    const top = popularSpots[0];
    if (!top || top.mainPhoto.lat === 0 || top.mainPhoto.lng === 0) return;
    setCenterOn({ lat: top.mainPhoto.lat, lng: top.mainPhoto.lng });
    setSelectedSpotName(top.name);
    autoCenteredRef.current = true;
  }, [popularSpots]);

  // Top 5 photos at the currently-selected spot (already sorted by weight).
  const selectedSpot = selectedSpotName
    ? popularSpots.find((s) => s.name === selectedSpotName) ?? null
    : null;
  const topPhotosAtSpot = selectedSpot ? selectedSpot.photos.slice(0, 5) : [];

  // Lookup against visiblePhotos so deep links to a locked-color photo
  // simply don't open the modal (rather than leaking a hidden image).
  const selectedPhotoData = selectedPhoto
    ? visiblePhotos.find((p) => p.id === selectedPhoto)
    : null;

  // Filter photos by color when selected (operates on the already-visible
  // set, so locked colors can never sneak through even via the chip strip).
  const filteredPhotos = selectedColorFilter
    ? visiblePhotos.filter((p) => p.color === selectedColorFilter)
    : visiblePhotos;

  // Sort photos
  const sortedPhotos = [...filteredPhotos].sort((a, b) => {
    if (sortBy === 'popular') {
      const scoreA = a.likes + a.favorites * 2;
      const scoreB = b.likes + b.favorites * 2;
      return scoreB - scoreA;
    }
    return b.timestamp.getTime() - a.timestamp.getTime();
  });

  // Filter chips at the top: top 3 colors with photos. Picker exposes the
  // full server palette — those are the only IDs /api/detect-color emits,
  // so they're the only colors that can match a photo.
  const collectedColors = palette
    .filter((color) => getPhotoCount(color.id) > 0)
    .slice(0, 3);

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
              ? `${filteredPhotos.length} photos`
              : `${visiblePhotos.length} photos`}
          </p>
          {/* Friendly reminder that gating is happening — only shown when
              there's actually a gate (signed-in user with a palette loaded). */}
          {unlockedSet !== null && palette.length > 0 && (
            <p className="text-xs text-gray-400 mt-0.5">
              You can only view unlocked colors.
            </p>
          )}
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
                className="w-4 h-4 rounded-full shadow-sm flex-shrink-0 border border-gray-200"
                style={{ backgroundColor: color.morandi }}
              />
              <span className="text-gray-700 font-medium">{color.fancyName ?? color.name}</span>
            </button>
          ))}

          {/* Color Picker button — shows the active filter color when one
              is selected, falls back to the palette icon otherwise. */}
          {(() => {
            const active = selectedColorFilter
              ? getPaletteColor(selectedColorFilter)
              : null;
            return (
              <button
                type="button"
                onClick={() => setShowColorPicker(true)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm whitespace-nowrap transition-all flex-shrink-0 border ${
                  active
                    ? 'bg-white text-[#2D2520] border-[#2D2520]/20 shadow-sm'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border-gray-200'
                }`}
                aria-label={
                  active
                    ? `Filtering by ${active.fancyName ?? active.name}`
                    : 'Open color picker'
                }
              >
                {active ? (
                  <span
                    className="w-4 h-4 rounded-full border border-gray-200"
                    style={{ backgroundColor: active.morandi }}
                  />
                ) : (
                  <Palette className="w-4 h-4 text-[#C89F7B]" />
                )}
                <span className="font-medium">
                  {active ? (active.fancyName ?? active.name) : 'Color Picker'}
                </span>
              </button>
            );
          })()}

          {/* Spacer to push right items - Always pushes to right */}
          <div className="flex-1" />

          {/* Sort toggle — segmented pill matching the color chips above. */}
          <div className="flex items-center bg-white rounded-full border border-gray-200 p-0.5 flex-shrink-0">
            <button
              type="button"
              onClick={() => setSortBy('recent')}
              aria-pressed={sortBy === 'recent'}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                sortBy === 'recent'
                  ? 'bg-[#2D2520] text-white shadow-sm'
                  : 'text-gray-600 hover:text-[#2D2520]'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">Recent</span>
            </button>
            <button
              type="button"
              onClick={() => setSortBy('popular')}
              aria-pressed={sortBy === 'popular'}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                sortBy === 'popular'
                  ? 'bg-[#2D2520] text-white shadow-sm'
                  : 'text-gray-600 hover:text-[#2D2520]'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Popular</span>
            </button>
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
        {viewMode === 'grid' &&
          (sortedPhotos.length > 0 ? (
            <>
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
              {/* End-of-list marker so users know they've seen everything. */}
              <p className="text-center text-sm text-gray-400 mb-6">
                — You've reached the end —
              </p>
            </>
          ) : (
            // Empty state — only reachable when the user has zero unlocked
            // colors (since picker tiles for locked colors are disabled, no
            // filter can produce a partial-empty case).
            <div className="bg-white rounded-3xl p-8 text-center shadow-sm mb-6 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FF8A65] to-[#9575CD] flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-[#2D2520] mb-2">
                Your gallery is locked
              </h3>
              <p className="text-sm text-gray-600 mb-5 max-w-sm mx-auto leading-relaxed">
                Upload a photo to unlock its color — then you'll see all the
                photos other walkers have captured in that color.
              </p>
              <Link
                to="/upload"
                className="inline-flex items-center gap-2 bg-[#2D2520] text-white px-6 py-3 rounded-full font-semibold shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95"
              >
                <Camera className="w-5 h-5" />
                Take your first photo
              </Link>
            </div>
          ))}

        {/* MAP VIEW */}
        {viewMode === 'map' && (
          <>
            <PhotoMap
              photos={visiblePhotos}
              onSelect={setSelectedPhoto}
              centerOn={centerOn}
            />

            {/* Top photos at the currently-selected spot. Markers stack at
                the same lat/lng on the map so this strip is the only way to
                reach the buried photos. Tap any thumb → opens PhotoDetail. */}
            {selectedSpot && topPhotosAtSpot.length > 0 && (
              <div className="mb-6">
                <p className="text-sm font-semibold text-[#2D2520] mb-3 truncate">
                  Top at <span className="text-gray-600">{selectedSpot.name}</span>
                </p>
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
                  {topPhotosAtSpot.map((photo) => (
                    <button
                      type="button"
                      key={photo.id}
                      onClick={() => setSelectedPhoto(photo.id)}
                      className="flex-shrink-0 w-24 h-24 rounded-2xl overflow-hidden shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all"
                    >
                      <img
                        src={photo.imageUrl}
                        alt={photo.location}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Popular Spots — aggregated by location *name* so the same
                place isn't listed multiple times. Tap a row to pan the
                map there (no modal). */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#C89F7B]" />
                  Popular Spots
                </h2>
                <span className="text-sm text-gray-600">
                  {popularSpots.length} location{popularSpots.length === 1 ? '' : 's'}
                </span>
              </div>

              <div className="space-y-3">
                {popularSpots.slice(0, 6).map(({ name, photos, mainPhoto }) => {
                  const hasCoords = mainPhoto.lat !== 0 && mainPhoto.lng !== 0;
                  return (
                    <button
                      type="button"
                      key={name}
                      onClick={() => {
                        if (!hasCoords) return;
                        // Fresh object identity per click so PhotoMap re-pans
                        // even if the user taps the same row twice.
                        setCenterOn({ lat: mainPhoto.lat, lng: mainPhoto.lng });
                        setSelectedSpotName(name);
                      }}
                      disabled={!hasCoords}
                      className="w-full bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex items-center gap-3 text-left disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {/* Top photo at the spot — distinguishes locations even
                          when several uploads share the same author. */}
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                        <img
                          src={mainPhoto.imageUrl}
                          alt={name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[#2D2520] truncate">{name}</p>
                        <p className="text-sm text-gray-600">
                          {photos.length} photo{photos.length === 1 ? '' : 's'}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
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

            {/* Reset to "All" */}
            <button
              type="button"
              onClick={() => {
                setSelectedColorFilter(null);
                setShowColorPicker(false);
              }}
              className={`w-full mb-4 py-2.5 rounded-2xl text-sm font-semibold transition-colors ${
                selectedColorFilter === null
                  ? 'bg-[#2D2520] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Colors · {visiblePhotos.length}
            </button>

            {/* Palette grid — locked when unlockedSet exists and excludes
                the color (i.e. signed-in user hasn't uploaded this color
                yet). Locked tiles are non-interactive. */}
            <div className="grid grid-cols-4 gap-3">
              {palette.map((color, index) => {
                const count = getPhotoCount(color.id);
                const isSelected = selectedColorFilter === color.id;
                const isLocked =
                  unlockedSet !== null && !unlockedSet.has(color.id);

                return (
                  <button
                    type="button"
                    key={color.id}
                    onClick={() => {
                      if (isLocked) return;
                      // Toggle: tapping the already-selected tile clears
                      // the filter (back to All Colors).
                      setSelectedColorFilter(isSelected ? null : color.id);
                      setShowColorPicker(false);
                    }}
                    disabled={isLocked}
                    className={`relative transition-all animate-scale-in ${
                      isLocked
                        ? 'cursor-not-allowed'
                        : 'hover:scale-105 active:scale-95'
                    } ${
                      isSelected ? 'ring-4 ring-[#2D2520] ring-offset-2' : ''
                    } ${isLocked || count === 0 ? 'opacity-50' : ''}`}
                    style={{ animationDelay: `${index * 0.03}s` }}
                    aria-label={
                      isLocked
                        ? `${color.fancyName ?? color.name} — locked`
                        : `Filter by ${color.fancyName ?? color.name}, ${count} photo${count === 1 ? '' : 's'}`
                    }
                  >
                    <div
                      className={`relative aspect-square rounded-2xl shadow-md border border-gray-200 ${
                        isLocked ? 'grayscale' : ''
                      }`}
                      style={{ backgroundColor: color.morandi }}
                    >
                      {isLocked && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/15 rounded-2xl">
                          <Lock className="w-5 h-5 text-white drop-shadow" />
                        </div>
                      )}
                    </div>
                    {!isLocked && count > 0 && (
                      <div className="absolute -top-1.5 -right-1.5 bg-[#2D2520] text-white text-xs rounded-full min-w-5 h-5 px-1 flex items-center justify-center font-bold shadow-md">
                        {count}
                      </div>
                    )}
                    <p
                      className={`text-xs text-center mt-1 font-medium leading-tight line-clamp-2 min-h-[2lh] ${
                        isLocked ? 'text-gray-400' : 'text-gray-700'
                      }`}
                    >
                      {color.fancyName ?? color.name}
                    </p>
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
