import { Camera, ImagePlus } from 'lucide-react';
import { useRef } from 'react';

interface Props {
  image: string | null;
  onSelect: (image: string) => void;
  onClear: () => void;
}

export function PhotoCapture({ image, onSelect, onClear }: Props) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      onSelect(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  if (image) {
    return (
      <div className="mb-4">
        <div className="relative aspect-square rounded-2xl overflow-hidden mb-3">
          <img src={image} alt="Preview" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={onClear}
            className="absolute top-3 right-3 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleImageSelect}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageSelect}
      />
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          className="aspect-square border-2 border-dashed border-gray-300 rounded-2xl hover:border-[#C89F7B] transition-colors cursor-pointer bg-[#F5F1ED] flex flex-col items-center justify-center gap-3"
        >
          <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-sm">
            <Camera className="w-7 h-7 text-[#C89F7B]" />
          </div>
          <p className="font-semibold text-[#2D2520] text-sm">Take Photo</p>
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="aspect-square border-2 border-dashed border-gray-300 rounded-2xl hover:border-[#C89F7B] transition-colors cursor-pointer bg-[#F5F1ED] flex flex-col items-center justify-center gap-3"
        >
          <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-sm">
            <ImagePlus className="w-7 h-7 text-[#C89F7B]" />
          </div>
          <p className="font-semibold text-[#2D2520] text-sm">From Gallery</p>
        </button>
      </div>
    </div>
  );
}
