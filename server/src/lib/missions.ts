// Static mission catalog. Lives here so /api/missions has a single source of
// truth — when missions become first-class state (DB-backed progress, team
// coordination), swap this for a Mongoose model and a service.

export interface Mission {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'legendary';
  reward: number;
  color: string;
  location?: string;
  lat?: number;
  lng?: number;
  progress?: number;
  total?: number;
  completed?: boolean;
  teamMission?: boolean;
}

export const MISSIONS: Mission[] = [
  {
    id: 'm1',
    title: 'Find Blue Sky',
    description: 'Capture a photo of something blue in the sky',
    difficulty: 'easy',
    reward: 40,
    color: 'blue',
    progress: 0,
    total: 1,
    completed: false,
  },
  {
    id: 'm2',
    title: 'Red Near Library',
    description: 'Find something red within 50m of the Central Library',
    difficulty: 'medium',
    reward: 80,
    color: 'red',
    location: 'Central Library',
    lat: 40.7589,
    lng: -73.9851,
    progress: 0,
    total: 1,
    completed: false,
  },
  {
    id: 'm3',
    title: 'Rainbow Collection',
    description: 'Collect photos of three different colors in one hour',
    difficulty: 'hard',
    reward: 150,
    color: 'rainbow',
    progress: 0,
    total: 3,
    completed: false,
  },
  {
    id: 'm4',
    title: 'Team Yellow Hunt',
    description: 'Work with your team to find 5 yellow objects across campus',
    difficulty: 'medium',
    reward: 80,
    color: 'yellow',
    progress: 2,
    total: 5,
    completed: false,
    teamMission: true,
  },
  {
    id: 'm5',
    title: 'Hidden Green Treasure',
    description: 'Follow the clues to discover the secret green location',
    difficulty: 'legendary',
    reward: 250,
    color: 'green',
    progress: 0,
    total: 1,
    completed: false,
  },
  {
    id: 'm6',
    title: 'Violet Evening',
    description: 'Capture violet hues during sunset (5pm-7pm)',
    difficulty: 'medium',
    reward: 80,
    color: 'violet',
    progress: 0,
    total: 1,
    completed: false,
  },
];
