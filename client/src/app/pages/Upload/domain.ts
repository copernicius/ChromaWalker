import { getPaletteColor, type Mission, PALETTE } from '../../data';

export type ColorId = string;
export type TaskType = 'daily' | 'solo' | 'team' | null;

const RAINBOW = 'rainbow' as const;

// Day-of-week rotation across the first 7 palette entries (red…violet).
// Used only as a UI fallback before useDailyMissionQuery resolves; the
// authoritative daily comes from /api/missions/daily.
export function getDailyColor() {
  return PALETTE[new Date().getDay() % 7];
}

// Required + detected colors both source from PALETTE so the user sees the
// same name (fancyName) and tone (morandi) on both sides of the comparison.
export function getColor(id: ColorId | null | undefined) {
  return getPaletteColor(id);
}

export function getDetectedColor(id: ColorId | null | undefined) {
  return getPaletteColor(id);
}

export function getRequiredColor(
  taskType: TaskType,
  mission: Mission | null,
  dailyColorId: ColorId,
): ColorId | null {
  // Mission color takes precedence — covers solo, team, AND daily-with-mission.
  // The dailyColorId fallback is only for daily without a specific mission.
  if (mission && mission.color !== RAINBOW) return mission.color;
  if (taskType === 'daily') return dailyColorId;
  return null;
}

export function colorMatches(detected: ColorId, required: ColorId | null): boolean {
  return required === null || detected === required;
}

export function calculatePoints(taskType: TaskType, mission: Mission | null): number {
  if (mission) return mission.reward;
  if (taskType === 'daily') return 20;
  return 10;
}
