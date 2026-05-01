// Mock data for ChromaWalk

export const RAINBOW_COLORS = [
  { id: 'red', name: 'Sunset Orange', category: 'WARM', hex: '#FF8A65', unlocked: true },
  { id: 'orange', name: 'Burnt Sienna', category: 'WARM', hex: '#D2691E', unlocked: true },
  { id: 'yellow', name: 'Lemon Zest', category: 'NEUTRAL', hex: '#FFD54F', unlocked: true },
  { id: 'green', name: 'Sage Green', category: 'EARTH', hex: '#8BA888', unlocked: true },
  { id: 'blue', name: 'Ocean Teal', category: 'COOL', hex: '#4DB6AC', unlocked: true },
  { id: 'indigo', name: 'Soft Lavender', category: 'RARE', hex: '#9575CD', unlocked: true },
  { id: 'violet', name: 'Dusty Violet', category: 'RARE', hex: '#AB98C5', unlocked: true },
];

export const RARE_COLORS = [
  { id: 'pink', name: 'Warm Blush', category: 'WARM', hex: '#E8B4A8', unlocked: false, requiredLevel: 5 },
  { id: 'gold', name: 'Golden Hour', category: 'WARM', hex: '#F4C430', unlocked: false, requiredLevel: 8 },
  { id: 'turquoise', name: 'Terracotta', category: 'EARTH', hex: '#B07356', unlocked: false, requiredLevel: 10 },
];

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