import { Check } from 'lucide-react';

interface ColorMeta {
  id: string;
  name: string;
  hex: string;
}

interface Props {
  requiredColor: ColorMeta | null;
  colorPassed: boolean;
}

export function RequiredColorDisplay({ requiredColor, colorPassed }: Props) {
  const hex = requiredColor?.hex ?? '#ccc';
  const name = requiredColor?.name ?? 'Any color';

  return (
    <div className="mb-4 animate-scale-in">
      <span className="block text-sm font-semibold mb-3 text-[#2D2520] flex items-center gap-2">
        🎯 Required Color
        {colorPassed && <span className="text-xs text-green-600 font-normal">(Verified!)</span>}
      </span>
      <div
        className={`relative rounded-3xl p-6 shadow-lg transition-all ${
          colorPassed ? 'ring-4 ring-green-500 ring-offset-2' : 'ring-2 ring-offset-2'
        }`}
        style={{
          background: `linear-gradient(135deg, ${hex} 0%, ${hex}dd 100%)`,
        }}
      >
        <div
          className="absolute -top-2 -right-2 w-24 h-24 rounded-full opacity-20 animate-pulse"
          style={{ backgroundColor: hex }}
        />

        <div className="relative z-10 flex items-center gap-4">
          <div className="flex-1 text-white">
            <p className="text-2xl font-bold mb-2">{name}</p>
            <p className="text-sm opacity-90">
              {colorPassed ? '✓ Your photo matches this color!' : 'Find and photograph this color'}
            </p>
          </div>
          {colorPassed && (
            <div className="flex-shrink-0 animate-bounce">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
                <Check className="w-7 h-7 text-green-500" strokeWidth={3} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
