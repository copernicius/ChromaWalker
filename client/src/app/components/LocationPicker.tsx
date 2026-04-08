import { GoogleMap, Marker, useLoadScript } from '@react-google-maps/api';
import { MapPin, Navigation } from 'lucide-react';
import { useCallback, useState } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';

const mapContainerStyle = {
  width: '100%',
  height: '400px',
};

const defaultCenter = {
  lat: 40.7128,
  lng: -74.006, // Default to New York City
};

// Get Google Maps API key from environment variable
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

interface LocationPickerProps {
  location: string;
  onLocationChange: (location: string, coordinates?: { lat: number; lng: number }) => void;
}

export function LocationPicker({ location, onLocationChange }: LocationPickerProps) {
  const [showMapDialog, setShowMapDialog] = useState(false);
  const [markerPosition, setMarkerPosition] = useState(defaultCenter);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Load Google Maps script only if API key exists
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    id: 'google-map-script',
  });

  // Get current location using browser's geolocation API
  const handleGetCurrentLocation = useCallback(() => {
    setIsGettingLocation(true);

    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const coords = { lat: latitude, lng: longitude };

        // Update marker position for map
        setMarkerPosition(coords);

        // Reverse geocode to get address
        if (GOOGLE_MAPS_API_KEY) {
          try {
            const response = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`,
            );

            if (response.ok) {
              const data = await response.json();
              if (data.results?.[0]) {
                onLocationChange(data.results[0].formatted_address, coords);
              } else {
                // Fallback to coordinates
                onLocationChange(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`, coords);
              }
            } else {
              // Fallback to coordinates
              onLocationChange(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`, coords);
            }
          } catch (_error) {
            // Fallback to coordinates if geocoding fails
            onLocationChange(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`, coords);
          }
        } else {
          // No API key, just use coordinates
          onLocationChange(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`, coords);
        }

        // Close dialog if it was open
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
  }, [onLocationChange, showMapDialog]);

  // Handle map click to select location
  const handleMapClick = useCallback(
    async (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        const coords = { lat, lng };

        setMarkerPosition(coords);

        // Reverse geocode to get address
        if (GOOGLE_MAPS_API_KEY) {
          try {
            const response = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`,
            );

            if (response.ok) {
              const data = await response.json();
              if (data.results?.[0]) {
                onLocationChange(data.results[0].formatted_address, coords);
              } else {
                onLocationChange(`${lat.toFixed(6)}, ${lng.toFixed(6)}`, coords);
              }
            } else {
              onLocationChange(`${lat.toFixed(6)}, ${lng.toFixed(6)}`, coords);
            }
          } catch (_error) {
            onLocationChange(`${lat.toFixed(6)}, ${lng.toFixed(6)}`, coords);
          }
        } else {
          // No API key, just use coordinates
          onLocationChange(`${lat.toFixed(6)}, ${lng.toFixed(6)}`, coords);
        }
      }
    },
    [onLocationChange],
  );

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
              {GOOGLE_MAPS_API_KEY
                ? 'Click on the map to select a location, or use the button below to get your current location'
                : 'Use your current location or enter an address manually'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {GOOGLE_MAPS_API_KEY && isLoaded ? (
              <>
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={markerPosition}
                  zoom={13}
                  onClick={handleMapClick}
                >
                  <Marker position={markerPosition} />
                </GoogleMap>

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
            ) : loadError ? (
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
                  {isGettingLocation ? 'Getting location...' : 'Use Current Location (Coordinates)'}
                </Button>
              </div>
            ) : !GOOGLE_MAPS_API_KEY ? (
              <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center">
                <MapPin className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-1 font-semibold text-sm">
                  Google Maps API Key Required
                </p>
                <p className="text-xs text-gray-500 mb-4">
                  To use the map, add your API key to the .env file
                </p>
                <Button
                  onClick={handleGetCurrentLocation}
                  disabled={isGettingLocation}
                  className="bg-[#2D2520] hover:bg-[#2D2520]/90 text-white w-full"
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  {isGettingLocation ? 'Getting location...' : 'Use Current Location (Coordinates)'}
                </Button>
              </div>
            ) : (
              <div className="bg-gray-50 border-2 border-gray-300 rounded-2xl p-6 text-center">
                <div className="w-10 h-10 border-4 border-gray-300 border-t-[#C89F7B] rounded-full animate-spin mx-auto mb-3" />
                <p className="text-gray-600 text-sm">Loading map...</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
