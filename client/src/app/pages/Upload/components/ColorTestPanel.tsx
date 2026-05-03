import { Check, Sparkles } from 'lucide-react';
import type { ColorId } from '../domain';

interface ColorMeta {
  id: string;
  name: string;
  fancyName?: string;
  hex: string;
  morandi?: string;
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

  // Show both names so the user sees the boutique label and the
  // actionable literal at once, e.g. "Burnt Sienna (Orange)".
  const formatColorName = (
    c: { fancyName?: string; name: string } | null | undefined,
  ): string => {
    if (!c) return '';
    if (c.fancyName && c.fancyName !== c.name) return `${c.fancyName} (${c.name})`;
    return c.name;
  };
  const detectedName = formatColorName(detectedColor);
  const requiredName = formatColorName(requiredColor) || 'Any color';

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
                {requiredName}
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
  const detectedHex = detectedColor?.morandi ?? detectedColor?.hex ?? '#ccc';

  return (
    <div
      className={`w-full rounded-2xl overflow-hidden shadow-sm transition-all animate-scale-in ${
        colorPassed
          ? 'bg-white ring-1 ring-green-400'
          : 'bg-white ring-1 ring-red-400'
      }`}
    >
      {/* Color Display Header — solid Morandi tone (no alpha gradient,
          which would wash out the already-soft palette into pastel). */}
      <div
        className="px-4 py-3 relative overflow-hidden"
        style={{ backgroundColor: detectedHex }}
      >
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex-shrink-0">
            {colorPassed ? (
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md">
                <Check className="w-5 h-5 text-green-500" strokeWidth={3} />
              </div>
            ) : (
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md">
                <span className="text-lg font-bold text-red-500">✕</span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-base leading-tight drop-shadow-sm truncate">
              {detectedName}
            </p>
            <p className="text-white/90 text-xs">Detected from your photo</p>
          </div>
        </div>
      </div>

      {/* Result Message */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 mb-1">
          <p
            className={`font-semibold text-sm ${colorPassed ? 'text-green-800' : 'text-red-800'}`}
          >
            {colorPassed
              ? hasTaskRequirement
                ? 'Perfect Match!'
                : 'Color Detected'
              : 'Color Mismatch'}
          </p>
          {colorPassed && hasTaskRequirement && <span className="text-sm">✨</span>}
        </div>
        <p
          className={`text-xs leading-relaxed ${colorPassed ? 'text-green-700' : 'text-red-700'}`}
        >
          {colorPassed ? (
            hasTaskRequirement ? (
              <>This color matches the required color for your task.</>
            ) : (
              <>Your photo has been analyzed. You can upload it now.</>
            )
          ) : (
            <>
              This photo contains <strong>{detectedName}</strong>, but your task requires{' '}
              <strong>{requiredName}</strong>.
            </>
          )}
        </p>
        {!colorPassed && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-2 text-xs text-red-700 font-semibold hover:text-red-900 underline decoration-2 underline-offset-2 transition-colors"
          >
            Take another photo →
          </button>
        )}
      </div>
    </div>
  );
}

export type { ColorMeta };
