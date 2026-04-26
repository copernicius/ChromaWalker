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

export const MOCK_PHOTOS: Photo[] = [
  // Red photos
  {
    id: '1',
    imageUrl: 'https://images.unsplash.com/photo-1518895312237-a9e23508077d?w=800',
    color: 'red',
    location: 'Central Library',
    lat: 40.7589,
    lng: -73.9851,
    likes: 24,
    favorites: 8,
    username: 'colorhunter',
    timestamp: new Date('2026-03-20T14:30:00'),
    comments: 5,
    caption: 'Beautiful sunset orange glow on the historic library building',
    colorPalette: ['#FF8A65', '#FF7043', '#FF5722', '#E64A19'],
    userRole: 'Color Explorer',
    commentsList: [
      { id: 'c1', username: 'Alex Johnson', text: 'Amazing capture! Love the warm tones 🎨' },
      { id: 'c2', username: 'Taylor Brown', text: 'The lighting is perfect! ✨' },
      { id: 'c3', username: 'Sarah Miller', text: 'This spot is always so photogenic 📸' },
    ],
  },
  {
    id: '2',
    imageUrl: 'https://images.unsplash.com/photo-1481349518771-20055b2a7b24?w=800',
    color: 'red',
    location: 'Arts Building',
    lat: 40.7614,
    lng: -73.9776,
    likes: 31,
    favorites: 12,
    username: 'explorer92',
    timestamp: new Date('2026-03-21T10:15:00'),
    comments: 3,
    caption: 'Morning light painting the brick walls in warm orange hues',
    colorPalette: ['#FF8A65', '#D84315', '#BF360C', '#FF6E40'],
    userRole: 'Photographer',
    commentsList: [
      { id: 'c4', username: 'Mike Chen', text: 'Great composition! 👏' },
      { id: 'c5', username: 'Emma Davis', text: 'Love this angle!' },
    ],
  },
  {
    id: '3',
    imageUrl: 'https://images.unsplash.com/photo-1561052967-61fc91e48d79?w=800',
    color: 'red',
    location: 'Campus Garden',
    lat: 40.7580,
    lng: -73.9855,
    likes: 18,
    favorites: 5,
    username: 'photowalk',
    timestamp: new Date('2026-03-19T16:45:00'),
    comments: 2,
    caption: 'Autumn leaves creating a natural orange palette',
    colorPalette: ['#FF8A65', '#F4511E', '#FF7043', '#FF5722'],
    userRole: 'Nature Enthusiast',
  },
  // Orange photos
  {
    id: '4',
    imageUrl: 'https://images.unsplash.com/photo-1582169296194-e4d644c48063?w=800',
    color: 'orange',
    location: 'Student Center',
    lat: 40.7565,
    lng: -73.9830,
    likes: 27,
    favorites: 9,
    username: 'sunseeker',
    timestamp: new Date('2026-03-20T17:20:00'),
    comments: 4,
    caption: 'Burnt sienna tones in the golden hour',
    colorPalette: ['#D2691E', '#CD853F', '#DEB887', '#F4A460'],
    userRole: 'Color Hunter',
    commentsList: [
      { id: 'c6', username: 'Jordan Lee', text: 'Golden hour magic! 🌅' },
      { id: 'c7', username: 'Chris Park', text: 'This color is so warm and inviting!' },
    ],
  },
  {
    id: '5',
    imageUrl: 'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=800',
    color: 'orange',
    location: 'Engineering Quad',
    lat: 40.7600,
    lng: -73.9800,
    likes: 22,
    favorites: 7,
    username: 'colorhunter',
    timestamp: new Date('2026-03-21T09:30:00'),
    comments: 6,
    caption: 'Engineering quad bathed in warm orange light',
    colorPalette: ['#D2691E', '#FF8C00', '#FF6347', '#FF4500'],
    userRole: 'Tech Enthusiast',
    commentsList: [
      { id: 'c8', username: 'Lily White', text: 'The contrast is stunning!' },
      { id: 'c9', username: 'David Kim', text: 'Perfect lighting for a tech-themed photo!' },
    ],
  },
  // Yellow photos
  {
    id: '6',
    imageUrl: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=800',
    color: 'yellow',
    location: 'Main Plaza',
    lat: 40.7595,
    lng: -73.9845,
    likes: 35,
    favorites: 15,
    username: 'sunshine_walker',
    timestamp: new Date('2026-03-20T12:00:00'),
    comments: 8,
    caption: 'Golden hour light reflecting off the plaza',
    colorPalette: ['#FFD54F', '#FFC107', '#FF8F00', '#FF6F00'],
    userRole: 'Sunshine Seeker',
    commentsList: [
      { id: 'c10', username: 'Sophia Lee', text: 'The light is breathtaking!' },
      { id: 'c11', username: 'James Smith', text: 'Perfect for a warm, inviting photo!' },
    ],
  },
  {
    id: '7',
    imageUrl: 'https://images.unsplash.com/photo-1502307200623-b0651a8e1d2d?w=800',
    color: 'yellow',
    location: 'Botanical Gardens',
    lat: 40.7575,
    lng: -73.9860,
    likes: 29,
    favorites: 11,
    username: 'explorer92',
    timestamp: new Date('2026-03-21T14:20:00'),
    comments: 7,
    caption: 'Botanical gardens in a golden hour glow',
    colorPalette: ['#FFD54F', '#FFC107', '#FF8F00', '#FF6F00'],
    userRole: 'Nature Lover',
    commentsList: [
      { id: 'c12', username: 'Mia Johnson', text: 'The colors are so vibrant!' },
      { id: 'c13', username: 'Benjamin Lee', text: 'Perfect for a nature-themed photo!' },
    ],
  },
  // Green photos
  {
    id: '8',
    imageUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800',
    color: 'green',
    location: 'North Campus',
    lat: 40.7620,
    lng: -73.9770,
    likes: 26,
    favorites: 10,
    username: 'nature_lens',
    timestamp: new Date('2026-03-19T11:30:00'),
    comments: 4,
    caption: 'North campus in a serene green hue',
    colorPalette: ['#8BA888', '#689F38', '#4CAF50', '#43A047'],
    userRole: 'Nature Photographer',
    commentsList: [
      { id: 'c14', username: 'Olivia Brown', text: 'The colors are so calming!' },
      { id: 'c15', username: 'Daniel Kim', text: 'Perfect for a nature-themed photo!' },
    ],
  },
  {
    id: '9',
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
    color: 'green',
    location: 'Science Building',
    lat: 40.7610,
    lng: -73.9790,
    likes: 20,
    favorites: 6,
    username: 'photowalk',
    timestamp: new Date('2026-03-20T15:45:00'),
    comments: 3,
    caption: 'Science building in a green hue',
    colorPalette: ['#8BA888', '#689F38', '#4CAF50', '#43A047'],
    userRole: 'Science Enthusiast',
    commentsList: [
      { id: 'c16', username: 'Grace Chen', text: 'The colors are so vibrant!' },
      { id: 'c17', username: 'Andrew Lee', text: 'Perfect for a science-themed photo!' },
    ],
  },
  // Blue photos
  {
    id: '10',
    imageUrl: 'https://images.unsplash.com/photo-1535268647677-300dbf3d78d1?w=800',
    color: 'blue',
    location: 'Athletic Center',
    lat: 40.7555,
    lng: -73.9815,
    likes: 33,
    favorites: 13,
    username: 'sky_explorer',
    timestamp: new Date('2026-03-21T08:15:00'),
    comments: 9,
    caption: 'Athletic center in a blue hue',
    colorPalette: ['#4DB6AC', '#009688', '#00897B', '#00796B'],
    userRole: 'Athletic Enthusiast',
    commentsList: [
      { id: 'c18', username: 'Ella Johnson', text: 'The colors are so vibrant!' },
      { id: 'c19', username: 'Matthew Lee', text: 'Perfect for an athletic-themed photo!' },
    ],
  },
  {
    id: '11',
    imageUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800',
    color: 'blue',
    location: 'Lake View Point',
    lat: 40.7570,
    lng: -73.9875,
    likes: 42,
    favorites: 18,
    username: 'colorhunter',
    timestamp: new Date('2026-03-20T07:30:00'),
    comments: 11,
    caption: 'Lake view point in a blue hue',
    colorPalette: ['#4DB6AC', '#009688', '#00897B', '#00796B'],
    userRole: 'Nature Photographer',
    commentsList: [
      { id: 'c20', username: 'Sophie Brown', text: 'The colors are so calming!' },
      { id: 'c21', username: 'Christopher Lee', text: 'Perfect for a nature-themed photo!' },
    ],
  },
  // Indigo photos
  {
    id: '12',
    imageUrl: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=800',
    color: 'indigo',
    location: 'Music Hall',
    lat: 40.7605,
    lng: -73.9825,
    likes: 19,
    favorites: 7,
    username: 'twilight_hunter',
    timestamp: new Date('2026-03-19T19:00:00'),
    comments: 2,
    caption: 'Music hall in a soft lavender hue',
    colorPalette: ['#9575CD', '#7986CB', '#5C6BC0', '#3F51B5'],
    userRole: 'Music Enthusiast',
    commentsList: [
      { id: 'c22', username: 'Ava Johnson', text: 'The colors are so calming!' },
      { id: 'c23', username: 'Ethan Lee', text: 'Perfect for a music-themed photo!' },
    ],
  },
  // Violet photos
  {
    id: '13',
    imageUrl: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=800',
    color: 'violet',
    location: 'Campus Park',
    lat: 40.7585,
    lng: -73.9840,
    likes: 28,
    favorites: 11,
    username: 'purple_reign',
    timestamp: new Date('2026-03-20T18:30:00'),
    comments: 6,
    caption: 'Campus park in a dusty violet hue',
    colorPalette: ['#AB98C5', '#9575CD', '#7986CB', '#5C6BC0'],
    userRole: 'Nature Photographer',
    commentsList: [
      { id: 'c24', username: 'Isabella Brown', text: 'The colors are so vibrant!' },
      { id: 'c25', username: 'Noah Lee', text: 'Perfect for a nature-themed photo!' },
    ],
  },
  {
    id: '14',
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800',
    color: 'violet',
    location: 'Drama Theater',
    lat: 40.7590,
    lng: -73.9810,
    likes: 25,
    favorites: 9,
    username: 'explorer92',
    timestamp: new Date('2026-03-21T16:00:00'),
    comments: 5,
    caption: 'Drama theater in a violet hue',
    colorPalette: ['#AB98C5', '#9575CD', '#7986CB', '#5C6BC0'],
    userRole: 'Theater Enthusiast',
    commentsList: [
      { id: 'c26', username: 'Mia Johnson', text: 'The colors are so vibrant!' },
      { id: 'c27', username: 'Benjamin Lee', text: 'Perfect for a theater-themed photo!' },
    ],
  },
];

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

export const MOCK_MISSIONS: Mission[] = [
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