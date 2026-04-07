import type { Achievement, Mission, Photo, UserProfile } from '../data/mockData';
import {
  MOCK_ACHIEVEMENTS,
  MOCK_MISSIONS,
  MOCK_PHOTOS,
  MOCK_USER,
  RAINBOW_COLORS,
  RARE_COLORS,
} from '../data/mockData';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const photoService = {
  getPhotos: async (): Promise<Photo[]> => {
    await delay(100);
    return MOCK_PHOTOS;
  },

  getPhotosByColor: async (colorId: string): Promise<Photo[]> => {
    await delay(100);
    return MOCK_PHOTOS.filter((p) => p.color === colorId);
  },

  getPhotosByUser: async (username: string): Promise<Photo[]> => {
    await delay(100);
    return MOCK_PHOTOS.filter((p) => p.username === username);
  },

  uploadPhoto: async (
    photo: Omit<Photo, 'id' | 'likes' | 'favorites' | 'comments'>,
  ): Promise<Photo> => {
    await delay(300);
    return {
      ...photo,
      id: `photo-${Date.now()}`,
      likes: 0,
      favorites: 0,
      comments: 0,
    };
  },
};

export const missionService = {
  getMissions: async (): Promise<Mission[]> => {
    await delay(100);
    return MOCK_MISSIONS;
  },

  getSoloMissions: async (): Promise<Mission[]> => {
    await delay(100);
    return MOCK_MISSIONS.filter((m) => !m.teamMission);
  },

  getTeamMissions: async (): Promise<Mission[]> => {
    await delay(100);
    return MOCK_MISSIONS.filter((m) => m.teamMission);
  },
};

export const userService = {
  getProfile: async (): Promise<UserProfile> => {
    await delay(100);
    return MOCK_USER;
  },

  getAchievements: async (): Promise<Achievement[]> => {
    await delay(100);
    return MOCK_ACHIEVEMENTS;
  },
};

export const colorService = {
  getColors: async () => {
    await delay(50);
    return RAINBOW_COLORS;
  },

  getRareColors: async () => {
    await delay(50);
    return RARE_COLORS;
  },

  getAllColors: async () => {
    await delay(50);
    return [...RAINBOW_COLORS, ...RARE_COLORS];
  },
};
