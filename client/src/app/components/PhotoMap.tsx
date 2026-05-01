import { importLibrary, setOptions } from '@googlemaps/js-api-loader';
import { Locate } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { Photo } from '../data';
import { useNearbyPhotosQuery } from '../queries';

setOptions({
  key: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  v: 'weekly',
});

// Auckland — same default as LocationPicker.
const DEFAULT_CENTER = { lat: -36.8485, lng: 174.7633 };
const DEFAULT_ZOOM = 12;
const NEARBY_RADIUS_M = 5000;

interface PhotoMapProps {
  photos: Photo[];
  onSelect: (photoId: string) => void;
  // When this object reference changes, the map pans to it and zooms in.
  // null/undefined leaves the map untouched.
  centerOn?: { lat: number; lng: number } | null;
}

export function PhotoMap({ photos, onSelect, centerOn }: PhotoMapProps) {
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const userMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(
    null,
  );
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const [loadError, setLoadError] = useState(false);
  // Flips true once the Google Map instance is constructed. Effects that
  // imperatively call map.* methods need to re-fire when this becomes true,
  // otherwise they bail out before the map exists and never get a second
  // chance (refs don't trigger re-renders).
  const [mapReady, setMapReady] = useState(false);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(
    null,
  );

  // Fire the nearby query whenever the user grants geolocation. Result is
  // toasted ("12 photos within 5km") and used to fly the map to that area.
  const { data: nearbyPhotos } = useNearbyPhotosQuery({
    lat: userPos?.lat ?? null,
    lng: userPos?.lng ?? null,
    radius: NEARBY_RADIUS_M,
  });

  // Initial map setup — runs once. Subsequent renders re-use the same map
  // instance and just diff markers.
  useEffect(() => {
    let cancelled = false;
    Promise.all([importLibrary('maps'), importLibrary('marker')])
      .then(([maps]) => {
        if (cancelled || !mapDivRef.current) return;
        mapRef.current = new maps.Map(mapDivRef.current, {
          center: DEFAULT_CENTER,
          zoom: DEFAULT_ZOOM,
          // mapId required for AdvancedMarkerElement.
          mapId: 'CHROMAWALK_MAP',
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: 'greedy',
        });
        setMapReady(true);
      })
      .catch(() => setLoadError(true));
    return () => {
      cancelled = true;
    };
  }, []);

  // Sync markers to the photos array. Clears and rebuilds on every change —
  // for class-project scale (≤ a few hundred photos) this is cheap; for big
  // gallery sizes you'd diff by id.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    let cancelled = false;
    importLibrary('marker').then((markerLib) => {
      if (cancelled) return;
      // Tear down old markers.
      for (const m of markersRef.current) m.map = null;
      markersRef.current = [];

      for (const photo of photos) {
        if (!photo.lat || !photo.lng) continue; // skip photos without real coords
        const el = document.createElement('button');
        el.type = 'button';
        el.className =
          'w-12 h-12 rounded-full border-[3px] border-white shadow-lg overflow-hidden cursor-pointer transition-transform hover:scale-110 active:scale-95';
        const img = document.createElement('img');
        img.src = photo.imageUrl;
        img.alt = photo.location;
        img.className = 'w-full h-full object-cover';
        img.referrerPolicy = 'no-referrer';
        el.appendChild(img);
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          onSelectRef.current(photo.id);
        });

        const marker = new markerLib.AdvancedMarkerElement({
          map,
          position: { lat: photo.lat, lng: photo.lng },
          content: el,
        });
        markersRef.current.push(marker);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [photos, mapReady]);

  // Drop a "you are here" marker (separate from photo markers) when geo
  // permission is granted; pan/zoom the map to that point.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !userPos) return;

    let cancelled = false;
    importLibrary('marker').then((markerLib) => {
      if (cancelled) return;
      if (userMarkerRef.current) userMarkerRef.current.map = null;
      const dot = document.createElement('div');
      dot.className =
        'w-4 h-4 rounded-full bg-blue-500 border-[3px] border-white shadow-md';
      userMarkerRef.current = new markerLib.AdvancedMarkerElement({
        map,
        position: userPos,
        content: dot,
        zIndex: 1000,
      });
      map.panTo(userPos);
      map.setZoom(14);
    });

    return () => {
      cancelled = true;
    };
  }, [userPos, mapReady]);

  // Surface nearby-query results once they arrive.
  useEffect(() => {
    if (nearbyPhotos === undefined) return;
    toast.success(
      `${nearbyPhotos.length} photo${nearbyPhotos.length === 1 ? '' : 's'} within ${NEARBY_RADIUS_M / 1000} km of you`,
    );
  }, [nearbyPhotos]);

  // Pan/zoom to a point (e.g. when the user taps a row in Popular Spots).
  // Re-fires whenever the centerOn object reference changes — parent should
  // pass a fresh object on each click so the same location can be tapped
  // twice in a row.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !centerOn) return;
    map.panTo(centerOn);
    map.setZoom(16);
  }, [centerOn, mapReady]);

  const handleLocate = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported by this browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => {
        toast.error(
          err.code === err.PERMISSION_DENIED
            ? 'Location permission denied'
            : 'Could not get your location',
        );
      },
      { enableHighAccuracy: false, timeout: 8000 },
    );
  }, []);

  if (loadError) {
    return (
      <div className="h-[450px] bg-white rounded-3xl flex items-center justify-center text-gray-500 text-sm shadow-lg mb-6">
        Map failed to load — check VITE_GOOGLE_MAPS_API_KEY
      </div>
    );
  }

  return (
    <div className="relative h-[450px] rounded-3xl overflow-hidden shadow-lg mb-6">
      <div ref={mapDivRef} className="absolute inset-0" />

      {/* Locate button — bottom-left so it doesn't collide with Google's
          default +/- zoom controls (bottom-right). */}
      <button
        type="button"
        onClick={handleLocate}
        aria-label="Center on my location"
        className="absolute bottom-4 left-4 bg-[#2D2520] text-white p-4 rounded-full shadow-xl hover:shadow-2xl transition-all hover:scale-110 active:scale-95 z-10"
      >
        <Locate className="w-6 h-6" />
      </button>
    </div>
  );
}
