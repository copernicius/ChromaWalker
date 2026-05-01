import { getPaletteColor, type Mission, RAINBOW_COLORS } from '../../data';

export type ColorId = string;
export type TaskType = 'daily' | 'solo' | 'team' | null;

const RAINBOW = 'rainbow' as const;

export function getDailyColor() {
  return RAINBOW_COLORS[new Date().getDay() % RAINBOW_COLORS.length];
}

export function getColor(id: ColorId | null | undefined) {
  if (!id) return null;
  return RAINBOW_COLORS.find((c) => c.id === id) ?? null;
}

export function getDetectedColor(id: ColorId | null | undefined) {
  return getPaletteColor(id) ?? getColor(id);
}

export function getRequiredColor(
  taskType: TaskType,
  mission: Mission | null,
  dailyColorId: ColorId,
): ColorId | null {
  if (taskType === 'daily') return dailyColorId;
  if (mission && mission.color !== RAINBOW) return mission.color;
  return null;
}

export function colorMatches(detected: ColorId, required: ColorId | null): boolean {
  return required === null || detected === required;
}

export function calculatePoints(taskType: TaskType, mission: Mission | null): number {
  if (taskType === 'daily') return 20;
  if (mission) return mission.reward;
  return 10;
}
