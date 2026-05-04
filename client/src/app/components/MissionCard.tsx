import { Check, Crown, MapPin, Sparkles, Trophy, Users, Zap } from 'lucide-react';
import { getPaletteColor, type Mission } from '../data';

interface MissionCardProps {
  mission: Mission;
  onClick?: () => void;
}

// Difficulty no longer drives the card color (which now reflects the
// mission's *target* color so the card is visually self-explanatory). It
// still picks the small icon next to "Easy / Medium / Hard / Legendary".
const difficultyIcon = {
  easy: Zap,
  medium: Sparkles,
  hard: Trophy,
  legendary: Crown,
} as const;

// Rainbow missions don't have a single palette color; show a band of
// gradient stops so the card still reads as "any color counts." Stops are
// the morandi values from data/colors.ts (red → orange → yellow → green
// → blue → violet) — keep in sync if the palette changes.
const RAINBOW_BG =
  'linear-gradient(135deg, #FF9BA0 0%, #E18430 25%, #FCBB67 50%, #7C9C7A 70%, #6E8FAA 85%, #B59CB0 100%)';

export function MissionCard({ mission, onClick }: MissionCardProps) {
  const DifficultyIcon = difficultyIcon[mission.difficulty];

  // Background = mission's target color, sourced from the gallery palette
  // (Morandi tone). Falls back to a neutral gray if the color id is unknown.
  const paletteColor = getPaletteColor(mission.color);
  const isRainbow = mission.color === 'rainbow';
  const bg = isRainbow ? RAINBOW_BG : (paletteColor?.morandi ?? '#9E9E9E');
  const decoColor = isRainbow ? '#B59CB0' : (paletteColor?.morandi ?? '#9E9E9E');

  const progressPercentage = mission.total ? ((mission.progress ?? 0) / mission.total) * 100 : 0;
  const isCompleted = mission.completed === true;
  // Literal palette name (e.g. "Red"), capitalized — fancy names ("Sunset
  // Coral") read as poetic but make the actionable target less obvious.
  const colorLabel = isRainbow
    ? 'Any color'
    : (paletteColor?.name ?? mission.color);

  return (
    <button
      type="button"
      disabled={isCompleted}
      className={`rounded-3xl p-6 shadow-sm text-white relative overflow-hidden w-full text-left transition-all ${
        isCompleted
          ? 'opacity-60 cursor-not-allowed'
          : 'cursor-pointer hover:shadow-lg hover:scale-102'
      }`}
      style={{ background: bg }}
      onClick={onClick}
    >
      {isCompleted && (
        <div className="absolute top-3 right-3 z-20 bg-white/25 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-semibold flex items-center gap-1 shadow-sm">
          <Check className="w-3 h-3" strokeWidth={3} />
          Completed
        </div>
      )}
      {/* Decorative background circles */}
      <div
        className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-20 animate-pulse"
        style={{ background: decoColor }}
      />
      <div
        className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full opacity-20 animate-pulse delay-75"
        style={{ background: decoColor }}
      />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <DifficultyIcon className="w-5 h-5 fill-white" />
              <span className="text-sm font-medium uppercase tracking-wide opacity-90">
                {mission.difficulty} Mission
              </span>
              {mission.teamMission && <Users className="w-4 h-4 ml-1" />}
            </div>
            <h3 className="text-2xl font-bold mb-2">{mission.title}</h3>
            <p className="text-sm opacity-90 leading-relaxed">{mission.description}</p>
          </div>
        </div>

        {/* Mission Details */}
        <div className="flex items-center flex-wrap gap-2 mb-4">
          {/* Target color chip — high-contrast pill so the actionable
              instruction ("find Red") jumps off the card. */}
          <span className="inline-flex items-center gap-1.5 bg-white/25 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-bold shadow-sm">
            <span
              className="w-3 h-3 rounded-full bg-white"
              aria-hidden
            />
            Find {colorLabel}
          </span>
          {mission.location && (
            <div className="flex items-center gap-1.5 text-sm opacity-90">
              <MapPin className="w-4 h-4" />
              <span>{mission.location}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-sm font-semibold">
            <Trophy className="w-4 h-4" />
            <span>+{mission.reward} points</span>
          </div>
        </div>

        {/* Progress Bar */}
        {mission.total && mission.total > 1 && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-medium opacity-90">Progress</span>
              <span className="font-bold">
                {mission.progress}/{mission.total}
              </span>
            </div>
            <div className="w-full bg-white/30 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-white h-2.5 rounded-full transition-all"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}

      </div>
    </button>
  );
}
