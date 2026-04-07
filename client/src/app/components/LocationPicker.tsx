import { useEffect, useRef, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
import { X } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet's default marker icon (broken by bundlers)
delete (L.Icon.Default.prototype as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
});

const DEFAULT_CENTER: L.LatLngTuple = [-36.853, 174.768]; // Auckland
const DEFAULT_ZOOM = 15;

interface LocationPickerProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (lat: number, lng: number, address: string) => void;
  initialCoords?: { lat: number; lng: number } | null;
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
    );
    const data = await res.json();
    const addr = data.address;
    const name = [addr.road, addr.suburb || addr.city || addr.town].filter(Boolean).join(', ');
    return name || data.display_name;
  } catch {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}

function MapClickHandler({
  onMove,
}: {
  onMove: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onMove(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function LocationPicker({ open, onClose, onConfirm, initialCoords }: LocationPickerProps) {
  const [pin, setPin] = useState<L.LatLngTuple | null>(null);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [center, setCenter] = useState<L.LatLngTuple>(
    initialCoords ? [initialCoords.lat, initialCoords.lng] : DEFAULT_CENTER,
  );
  const geolocated = useRef(false);

  // Try to center map on user's GPS on first open
  useEffect(() => {
    if (!open || geolocated.current || initialCoords) return;
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        const c: L.LatLngTuple = [pos.coords.latitude, pos.coords.longitude];
        setCenter(c);
        geolocated.current = true;
      },
      () => {
        // silently fall back to default
      },
      { enableHighAccuracy: true, timeout: 5000 },
    );
  }, [open, initialCoords]);

  // Reverse geocode whenever pin moves
  useEffect(() => {
    if (!pin) return;
    let cancelled = false;
    setLoading(true);
    reverseGeocode(pin[0], pin[1]).then((addr) => {
      if (!cancelled) {
        setAddress(addr);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [pin]);

  // Reset state when opened
  useEffect(() => {
    if (open) {
      setPin(null);
      setAddress('');
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#F5F1ED]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white shadow-sm">
        <button type="button" onClick={onClose} className="p-2 -ml-2">
          <X className="w-6 h-6 text-[#2D2520]" />
        </button>
        <h2 className="font-semibold text-[#2D2520]">Pick Location</h2>
        <button
          type="button"
          onClick={() => pin && onConfirm(pin[0], pin[1], address)}
          disabled={!pin || loading}
          className="text-sm font-semibold text-[#C89F7B] disabled:opacity-40"
        >
          Confirm
        </button>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <MapContainer
          center={center}
          zoom={DEFAULT_ZOOM}
          className="h-full w-full"
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onMove={(lat, lng) => setPin([lat, lng])} />
          {pin && <Marker position={pin} />}
        </MapContainer>

        {/* Hint overlay */}
        {!pin && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-md text-sm text-[#2D2520] pointer-events-none">
            Tap on the map to drop a pin
          </div>
        )}
      </div>

      {/* Address bar */}
      {pin && (
        <div className="px-4 py-3 bg-white border-t border-gray-100">
          <p className="text-sm text-gray-500 mb-0.5">Selected location</p>
          <p className="font-medium text-[#2D2520] truncate">
            {loading ? 'Looking up address...' : address}
          </p>
        </div>
      )}
    </div>
  );
}
