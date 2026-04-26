import { importLibrary, setOptions } from '@googlemaps/js-api-loader';
import { MapPin, Navigation } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';

setOptions({
  key: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  v: 'weekly',
});

const defaultCenter = { lat: -36.8485, lng: 174.7633 }; // Auckland

interface LocationPickerProps {
  location: string;
  onLocationChange: (location: string, coordinates?: { lat: number; lng: number }) => void;
}

export function LocationPicker({ location, onLocationChange }: LocationPickerProps) {
  const [showMapDialog, setShowMapDialog] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const reverseGeocodeRef = useRef<(lat: number, lng: number) => void>(undefined);

  // Pre-load geocoding library
  useEffect(() => {
    importLibrary('geocoding')
      .then((lib) => {
        geocoderRef.current = new lib.Geocoder();
      })
      .catch(() => setLoadError(true));
  }, []);

  const reverseGeocode = useCallback(
    (lat: number, lng: number) => {
      if (!geocoderRef.current) {
        onLocationChange(`${lat.toFixed(6)}, ${lng.toFixed(6)}`, { lat, lng });
        return;
      }
      geocoderRef.current.geocode(
        { location: { lat, lng } },
        (results: google.maps.GeocoderResult[] | null, status: google.maps.GeocoderStatus) => {
          if (status === 'OK' && results?.[0]) {
            onLocationChange(results[0].formatted_address, { lat, lng });
          } else {
            onLocationChange(`${lat.toFixed(6)}, ${lng.toFixed(6)}`, { lat, lng });
          }
        },
      );
    },
    [onLocationChange],
  );

  // Keep a stable ref so map listeners always call the latest reverseGeocode
  reverseGeocodeRef.current = reverseGeocode;

  // Callback ref: fires when the map container div mounts into the DOM
  const mapContainerRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node || mapRef.current) return;

      const initMap = async () => {
        try {
          const mapsLib = await importLibrary('maps');
          const markerLib = await importLibrary('marker');

          const map = new mapsLib.Map(node, {
            center: defaultCenter,
            zoom: 13,
            mapId: 'chromawalk-map',
          });
          mapRef.current = map;

          const marker = new markerLib.AdvancedMarkerElement({
            map,
            position: defaultCenter,
            gmpDraggable: true,
          });
          markerRef.current = marker;

          map.addListener('click', (e: google.maps.MapMouseEvent) => {
            if (e.latLng) {
              const pos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
              marker.position = pos;
              reverseGeocodeRef.current?.(pos.lat, pos.lng);
            }
          });

          marker.addListener('dragend', () => {
            const pos = marker.position as google.maps.LatLngLiteral;
            if (pos) {
              reverseGeocodeRef.current?.(pos.lat, pos.lng);
            }
          });
        } catch {
          setLoadError(true);
        }
      };

      initMap();
    },
    [],
  );

  // Clean up map instance when dialog closes
  useEffect(() => {
    if (!showMapDialog) {
      mapRef.current = null;
      markerRef.current = null;
    }
  }, [showMapDialog]);

  const handleGetCurrentLocation = useCallback(() => {
    setIsGettingLocation(true);

    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const coords = { lat: latitude, lng: longitude };

        if (mapRef.current && markerRef.current) {
          mapRef.current.panTo(coords);
          markerRef.current.position = coords;
        }

        reverseGeocode(latitude, longitude);

        if (showMapDialog) {
          setShowMapDialog(false);
        }
        setIsGettingLocation(false);
      },
      (error) => {
        let errorMessage = 'Unable to get your current location. ';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage +=
              'Location permission was denied. Please allow location access in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage +=
              'Location information is unavailable. Please try again or enter manually.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Location request timed out. Please try again.';
            break;
          default:
            errorMessage += 'Please enter your location manually.';
        }
        console.error('Geolocation error:', error.code, error.message);
        alert(errorMessage);
        setIsGettingLocation(false);
      },
    );
  }, [reverseGeocode, showMapDialog]);

  const handleConfirmLocation = () => {
    setShowMapDialog(false);
  };

  return (
    <div>
      {/* Location Input */}
      <div className="mb-6">
        <label className="block text-sm font-semibold mb-3 text-[#2D2520]" htmlFor="location-input">
          Location
        </label>
        <div className="relative">
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            id="location-input"
            type="text"
            value={location}
            onChange={(e) => onLocationChange(e.target.value)}
            placeholder="Enter location name"
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#2D2520]/20 bg-white"
          />
        </div>
        <div className="flex gap-2 mt-2">
          <button
            type="button"
            onClick={handleGetCurrentLocation}
            disabled={isGettingLocation}
            className="text-sm text-[#C89F7B] font-medium hover:text-[#B08968] transition-colors disabled:opacity-50 flex items-center gap-1"
          >
            <Navigation className="w-4 h-4" />
            {isGettingLocation ? 'Getting location...' : 'Use current location'}
          </button>
          <button
            type="button"
            onClick={() => setShowMapDialog(true)}
            className="text-sm text-[#C89F7B] font-medium hover:text-[#B08968] transition-colors flex items-center gap-1"
          >
            <MapPin className="w-4 h-4" />
            Select on map
          </button>
        </div>
      </div>

      {/* Map Dialog */}
      <Dialog open={showMapDialog} onOpenChange={setShowMapDialog}>
        <DialogContent className="bg-white border-none sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-xl font-semibold text-[#2D2520] flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#C89F7B]" />
              Select Location
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600 leading-relaxed">
              Click on the map to select a location, or use the button below to get your current
              location
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {loadError ? (
              <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-6 text-center">
                <MapPin className="w-10 h-10 text-red-400 mx-auto mb-3" />
                <p className="text-red-600 mb-1 font-semibold text-sm">Error Loading Maps</p>
                <p className="text-xs text-red-500 mb-4">
                  Check your API key and internet connection
                </p>
                <Button
                  onClick={handleGetCurrentLocation}
                  disabled={isGettingLocation}
                  className="bg-[#2D2520] hover:bg-[#2D2520]/90 text-white w-full"
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  {isGettingLocation ? 'Getting location...' : 'Use Current Location'}
                </Button>
              </div>
            ) : (
              <>
                <div
                  ref={mapContainerRef}
                  className="w-full h-[400px] rounded-2xl overflow-hidden bg-gray-100"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleGetCurrentLocation}
                    disabled={isGettingLocation}
                    className="flex-1 bg-white border-2 border-[#2D2520] text-[#2D2520] hover:bg-gray-50"
                  >
                    <Navigation className="w-4 h-4 mr-2" />
                    {isGettingLocation ? 'Getting location...' : 'Use Current Location'}
                  </Button>
                  <Button
                    onClick={handleConfirmLocation}
                    className="flex-1 bg-[#2D2520] hover:bg-[#2D2520]/90 text-white"
                  >
                    Confirm Location
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
