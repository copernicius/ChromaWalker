// Mock data for ChromaWalk
//
// The boutique RAINBOW_COLORS / RARE_COLORS arrays were removed during a
// palette consolidation pass. PALETTE (data/colors.ts) is the single source
// of truth for color metadata — it carries `name` (literal),
// `fancyName` (boutique label), `hex` (saturated), and `morandi` (display).

export interface Photo {
  id: string;
  imageUrl: string;
  color: string;
  location: string;
  lat: number;
  lng: number;
  likes: number;
  favorites: number;
  username: string;
  avatarUrl?: string;
  pointsAwarded?: number;
  timestamp: Date;
  comments: number;
  caption?: string;
  colorPalette?: string[];
  userRole?: string;
  commentsList?: Array<{
    id: string;
    username: string;
    text: string;
    avatar?: string;
  }>;
}

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


export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number;
  total: number;
}

export const MOCK_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'a1',
    name: 'Explorer',
    description: 'Upload photos in 5 different locations',
    icon: 'map-pin',
    unlocked: false,
    progress: 3,
    total: 5,
  },
  {
    id: 'a2',
    name: 'Color Hunter',
    description: 'Upload 10 photos',
    icon: 'camera',
    unlocked: true,
    progress: 10,
    total: 10,
  },
  {
    id: 'a3',
    name: 'Puzzle Master',
    description: 'Complete 5 missions',
    icon: 'puzzle',
    unlocked: false,
    progress: 2,
    total: 5,
  },
  {
    id: 'a4',
    name: 'Team Player',
    description: 'Join 10 team missions',
    icon: 'users',
    unlocked: false,
    progress: 4,
    total: 10,
  },
];

export interface UserProfile {
  username: string;
  level: number;
  points: number;
  nextLevelPoints: number;
  photosUploaded: number;
  missionsCompleted: number;
  avatarUrl: string;
}

export const MOCK_USER: UserProfile = {
  username: 'colorhunter',
  level: 5,
  points: 1240,
  nextLevelPoints: 1500,
  photosUploaded: 24,
  missionsCompleted: 8,
  avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=colorhunter',
};