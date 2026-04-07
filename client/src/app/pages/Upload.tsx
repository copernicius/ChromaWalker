import { Camera, Check, LocateFixed, Map, MapPin } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Header } from '../components/Header';
import { LocationPicker } from '../components/LocationPicker';
import { Button } from '../components/ui/button';
import { RAINBOW_COLORS } from '../data/mockData';

export function Upload() {
  const navigate = useNavigate();
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [location, setLocation] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploaded, setUploaded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [mapOpen, setMapOpen] = useState(false);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ lat: latitude, lng: longitude });

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
          );
          const data = await res.json();
          const addr = data.address;
          // Build a short, readable name: road + suburb/city
          const name = [addr.road, addr.suburb || addr.city || addr.town]
            .filter(Boolean)
            .join(', ');
          setLocation(name || data.display_name);
        } catch {
          setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setLocating(false);
        alert(`Unable to get location: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleSubmit = async () => {
    if (!imageFile) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('color', selectedColor);
      formData.append('location', location);
      formData.append('username', 'alice'); // TODO: replace with real user
      if (coords) {
        formData.append('lat', String(coords.lat));
        formData.append('lng', String(coords.lng));
      }

      const res = await fetch('/api/photos/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Upload failed');
      }

      setUploaded(true);
      setTimeout(() => navigate('/galleries'), 2000);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (uploaded) {
    return (
      <div className="min-h-screen bg-[#F5F1ED] pb-24 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-24 h-24 bg-[#8BA888] rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <Check className="w-14 h-14 text-white" strokeWidth={3} />
          </div>
          <h2 className="text-3xl font-bold mb-3 text-[#2D2520]">Photo Uploaded!</h2>
          <p className="text-lg text-[#C89F7B] mb-2 font-semibold">+10 points earned</p>
          <p className="text-sm text-gray-500">Redirecting to galleries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F1ED] pb-24">
      <Header title="" showBack />

      <div className="max-w-screen-xl mx-auto px-4 pt-16">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#2D2520] mb-2">
            Upload{' '}
            <span className="italic" style={{ fontFamily: 'var(--font-brand-serif)' }}>
              Photo
            </span>
          </h1>
          <p className="text-gray-600">Share your color discovery</p>
        </div>

        {/* Upload Area */}
        <div className="bg-white rounded-3xl p-6 shadow-sm mb-6">
          <h3 className="font-semibold mb-4 text-[#2D2520]">Choose Photo</h3>

          {imagePreview ? (
            <div className="relative aspect-square rounded-2xl overflow-hidden mb-4">
              <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => { setImagePreview(''); setImageFile(null); }}
                className="absolute top-3 right-3 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
              >
                ✕
              </button>
            </div>
          ) : (
            <label className="block aspect-square border-2 border-dashed border-gray-300 rounded-2xl hover:border-[#C89F7B] transition-colors cursor-pointer mb-4 bg-[#F5F1ED]">
              <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
              <div className="h-full flex flex-col items-center justify-center text-gray-500">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                  <Camera className="w-8 h-8 text-[#C89F7B]" />
                </div>
                <p className="font-semibold text-[#2D2520] mb-1">Tap to select photo</p>
                <p className="text-sm">or use camera</p>
              </div>
            </label>
          )}

          {/* Color Selection */}
          <div className="mb-4">
            <span className="block text-sm font-semibold mb-3 text-[#2D2520]">Select Color</span>
            <div className="grid grid-cols-7 gap-2">
              {RAINBOW_COLORS.map((color) => (
                <button
                  type="button"
                  key={color.id}
                  onClick={() => setSelectedColor(color.id)}
                  className={`aspect-square rounded-xl transition-all ${
                    selectedColor === color.id
                      ? 'ring-4 ring-[#2D2520] ring-offset-2 scale-105 shadow-md'
                      : 'hover:scale-105 shadow-sm'
                  }`}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                />
              ))}
            </div>
            {selectedColor && (
              <p className="text-sm text-gray-600 mt-2">
                Selected:{' '}
                <span className="font-semibold text-[#2D2520]">
                  {RAINBOW_COLORS.find((c) => c.id === selectedColor)?.name}
                </span>
              </p>
            )}
          </div>

          {/* Location Input */}
          <div className="mb-6">
            <label
              htmlFor="location-input"
              className="block text-sm font-semibold mb-3 text-[#2D2520]"
            >
              Location
            </label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="location-input"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Enter location name"
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#2D2520]/20 bg-white"
              />
            </div>
            <div className="flex gap-4 mt-2">
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={locating}
                className="text-sm text-[#C89F7B] font-medium hover:text-[#B08968] transition-colors disabled:opacity-50 flex items-center gap-1"
              >
                <LocateFixed className="w-4 h-4" />
                {locating ? 'Getting location...' : 'Use current location'}
              </button>
              <button
                type="button"
                onClick={() => setMapOpen(true)}
                className="text-sm text-[#C89F7B] font-medium hover:text-[#B08968] transition-colors flex items-center gap-1"
              >
                <Map className="w-4 h-4" />
                Pick on map
              </button>
            </div>

            <LocationPicker
              open={mapOpen}
              onClose={() => setMapOpen(false)}
              initialCoords={coords}
              onConfirm={(lat, lng, address) => {
                setCoords({ lat, lng });
                setLocation(address);
                setMapOpen(false);
              }}
            />
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={!imageFile || !selectedColor || !location || uploading}
            className="w-full bg-[#2D2520] hover:bg-[#2D2520]/90 text-white py-6 rounded-2xl text-base shadow-md disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : <>Upload Photo <span className="text-[#FFD54F] ml-2">+10 pts</span></>}
          </Button>
        </div>

        {/* Tips */}
        <div className="bg-gradient-to-br from-[#FF8A65]/10 to-[#9575CD]/10 border border-[#FF8A65]/20 rounded-2xl p-5">
          <h3 className="font-semibold text-[#2D2520] mb-3 flex items-center gap-2">
            <span>💡</span> Tips for Great Photos
          </h3>
          <ul className="text-sm text-gray-700 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-[#FF8A65]">•</span>
              <span>Find objects that clearly match the color</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#FFD54F]">•</span>
              <span>Good lighting makes colors pop</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#4DB6AC]">•</span>
              <span>Include interesting compositions</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#8BA888]">•</span>
              <span>Explore different locations for bonus points</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
