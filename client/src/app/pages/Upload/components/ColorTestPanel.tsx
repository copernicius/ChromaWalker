import { Check, Sparkles } from 'lucide-react';
import type { ColorId } from '../domain';

interface ColorMeta {
  id: string;
  name: string;
  hex: string;
}

interface Props {
  hasTaskRequirement: boolean;
  requiredColor: ColorMeta | null;
  detected: ColorId | null;
  detectedColor: ColorMeta | null;
  isTesting: boolean;
  colorPassed: boolean;
  onTest: () => void;
  onRetry: () => void;
}

export function ColorTestPanel({
  hasTaskRequirement,
  requiredColor,
  detected,
  detectedColor,
  isTesting,
  colorPassed,
  onTest,
  onRetry,
}: Props) {
  const isTested = detected !== null;

  if (!isTested && !isTesting) {
    return (
      <div className="animate-fade-in">
        <button
          type="button"
          onClick={onTest}
          className="w-full bg-gradient-to-r from-[#4DB6AC] to-[#8BA888] text-white py-3 rounded-2xl font-semibold shadow-md hover:shadow-lg transition-all duration-300 hover:scale-102 active:scale-95 flex items-center justify-center gap-2"
        >
          <Sparkles className="w-5 h-5" />
          {hasTaskRequirement ? 'Test Color Match' : 'Detect Color'}
        </button>
        <p className="text-xs text-gray-600 text-center mt-2 transition-opacity">
          {hasTaskRequirement ? (
            <>
              Will check if photo contains:{' '}
              <span className="font-semibold text-[#2D2520]">
                {requiredColor?.name ?? 'Any color'}
              </span>
            </>
          ) : (
            'AI will detect the dominant color in your photo'
          )}
        </p>
      </div>
    );
  }

  if (isTesting) {
    return (
      <div className="w-full bg-white border-2 border-gray-200 py-3 rounded-2xl flex items-center justify-center gap-2 text-gray-600 animate-fade-in">
        <div className="w-5 h-5 border-2 border-[#4DB6AC] border-t-transparent rounded-full animate-spin" />
        Analyzing color...
      </div>
    );
  }

  // Tested
  const detectedHex = detectedColor?.hex ?? '#ccc';
  const detectedName = detectedColor?.name ?? '';

  return (
    <div
      className={`w-full rounded-3xl overflow-hidden shadow-lg transition-all animate-scale-in ${
        colorPassed
          ? 'bg-white ring-2 ring-green-400 ring-offset-2'
          : 'bg-white ring-2 ring-red-400 ring-offset-2'
      }`}
    >
      {/* Color Display Header */}
      <div
        className="p-6 relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${detectedHex}dd 0%, ${detectedHex}99 100%)`,
        }}
      >
        <div
          className="absolute -top-4 -right-4 w-32 h-32 rounded-full opacity-20 animate-pulse"
          style={{ backgroundColor: detectedHex }}
        />
        <div
          className="absolute -bottom-4 -left-4 w-24 h-24 rounded-full opacity-15 animate-pulse"
          style={{ backgroundColor: detectedHex }}
        />

        <div className="relative z-10 flex items-center gap-4">
          <div className="flex-shrink-0">
            {colorPassed ? (
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-xl animate-bounce">
                <Check className="w-9 h-9 text-green-500" strokeWidth={3} />
              </div>
            ) : (
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-xl">
                <span className="text-3xl font-bold text-red-500">✕</span>
              </div>
            )}
          </div>
          <div className="flex-1">
            <p className="text-white font-bold text-2xl mb-1.5 drop-shadow-sm">{detectedName}</p>
            <p className="text-white/95 text-sm tracking-wide">Detected from your photo</p>
          </div>
        </div>
      </div>

      {/* Result Message */}
      <div className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {colorPassed ? (
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              ) : (
                <div className="w-2 h-2 bg-red-500 rounded-full" />
              )}
              <p
                className={`font-bold text-lg ${colorPassed ? 'text-green-800' : 'text-red-800'}`}
              >
                {colorPassed
                  ? hasTaskRequirement
                    ? 'Perfect Match!'
                    : 'Color Detected'
                  : 'Color Mismatch'}
              </p>
              {colorPassed && hasTaskRequirement && <span className="text-xl">✨</span>}
            </div>
            <p
              className={`text-sm leading-relaxed ${colorPassed ? 'text-green-700' : 'text-red-700'}`}
            >
              {colorPassed ? (
                hasTaskRequirement ? (
                  <>This color matches the required color for your task. You're ready to upload!</>
                ) : (
                  <>Your photo has been analyzed. You can now upload it with the detected color.</>
                )
              ) : (
                <>
                  This photo contains <strong>{detectedName}</strong>, but your task requires{' '}
                  <strong>{requiredColor?.name ?? 'Any color'}</strong>. Please try again.
                </>
              )}
            </p>
            {!colorPassed && (
              <button
                type="button"
                onClick={onRetry}
                className="mt-4 text-sm text-red-700 font-semibold hover:text-red-900 underline decoration-2 underline-offset-2 transition-colors"
              >
                Take another photo →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export type { ColorMeta };
