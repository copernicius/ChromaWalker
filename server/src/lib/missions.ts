// Static mission catalog for solo + daily. Team missions are user-created
// and live in the TeamMission collection — they are NOT in this file.
//
// Daily rotation: server picks DAILY_MISSIONS[dayOfYear % length] so every
// user sees the same daily on a given UTC day (Wordle-style).

export type Difficulty = 'easy' | 'medium' | 'hard' | 'legendary';

export interface MissionConfig {
  id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  reward: number;
  color: string; // palette id ('red', 'blue', …) or 'rainbow' for any
  target: number; // # of qualifying photos to complete
  location?: string;
  lat?: number;
  lng?: number;
}

// v1 solo missions — restricted to two constraints: color and target count.
// Rewards scale with target: 1 photo → 40, 2 photos → 80, 3 photos → 150.
// Don't reintroduce time/location-bound entries until the validator handles
// those constraints (see lib/taskValidation.ts).
export const SOLO_MISSIONS: MissionConfig[] = [
  {
    id: 's1',
    title: 'Coral Capture',
    description: 'Photograph one red object.',
    difficulty: 'easy',
    reward: 40,
    color: 'red',
    target: 1,
  },
  {
    id: 's2',
    title: 'Ocean Eyes',
    description: 'Collect two blue scenes.',
    difficulty: 'medium',
    reward: 80,
    color: 'blue',
    target: 2,
  },
  {
    id: 's3',
    title: 'Sage Sweep',
    description: 'Find one green moment.',
    difficulty: 'easy',
    reward: 40,
    color: 'green',
    target: 1,
  },
  {
    id: 's4',
    title: 'Sunset Trio',
    description: 'Capture three orange shots.',
    difficulty: 'hard',
    reward: 150,
    color: 'orange',
    target: 3,
  },
  {
    id: 's5',
    title: 'Lavender Loop',
    description: 'Collect two violet finds.',
    difficulty: 'medium',
    reward: 80,
    color: 'violet',
    target: 2,
  },
  {
    id: 's6',
    title: 'Goldenrod Hunt',
    description: 'One yellow capture.',
    difficulty: 'easy',
    reward: 40,
    color: 'yellow',
    target: 1,
  },
];

export const DAILY_MISSIONS: MissionConfig[] = [
  {
    id: 'd1',
    title: 'Pop of Red',
    description: 'Spot something red on your walk today',
    difficulty: 'easy',
    reward: 20,
    color: 'red',
    target: 1,
  },
  {
    id: 'd2',
    title: 'Sunset Hunt',
    description: 'Catch an orange surface in good light',
    difficulty: 'easy',
    reward: 20,
    color: 'orange',
    target: 1,
  },
  {
    id: 'd3',
    title: 'Yellow Brick Road',
    description: 'Find a yellow detail in your path',
    difficulty: 'easy',
    reward: 20,
    color: 'yellow',
    target: 1,
  },
  {
    id: 'd4',
    title: 'Green Grocer',
    description: 'A bit of green from a plant, sign, or wall',
    difficulty: 'easy',
    reward: 20,
    color: 'green',
    target: 1,
  },
  {
    id: 'd5',
    title: 'Sky Sketch',
    description: 'Capture a swatch of blue from your view',
    difficulty: 'easy',
    reward: 20,
    color: 'blue',
    target: 1,
  },
  {
    id: 'd6',
    title: 'Violet Hour',
    description: 'Find a touch of violet anywhere outside',
    difficulty: 'easy',
    reward: 20,
    color: 'violet',
    target: 1,
  },
  {
    id: 'd7',
    title: 'Pink Promise',
    description: 'Notice some pink in flowers, fabric, or paint',
    difficulty: 'easy',
    reward: 20,
    color: 'pink',
    target: 1,
  },
  {
    id: 'd8',
    title: 'Brown Earth',
    description: 'Capture brown — wood, stone, or soil',
    difficulty: 'easy',
    reward: 20,
    color: 'brown',
    target: 1,
  },
  {
    id: 'd9',
    title: 'Indigo Whisper',
    description: 'A deep blue-violet detail in your day',
    difficulty: 'easy',
    reward: 20,
    color: 'indigo',
    target: 1,
  },
  {
    id: 'd10',
    title: 'Black Tie',
    description: 'Find something boldly black around you',
    difficulty: 'easy',
    reward: 20,
    color: 'black',
    target: 1,
  },
];

// Day-of-year index — same daily for everyone on a given UTC day.
export function pickTodaysDailyMission(now: Date = new Date()): MissionConfig {
  const start = Date.UTC(now.getUTCFullYear(), 0, 0);
  const day = Math.floor((now.getTime() - start) / 86_400_000);
  return DAILY_MISSIONS[day % DAILY_MISSIONS.length];
}

// Lookup helper used by the upload controller to validate solo/daily ids.
export function findCatalogMission(id: string): MissionConfig | null {
  return (
    SOLO_MISSIONS.find((m) => m.id === id) ??
    DAILY_MISSIONS.find((m) => m.id === id) ??
    null
  );
}
