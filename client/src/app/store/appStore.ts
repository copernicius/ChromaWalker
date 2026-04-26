import { create } from 'zustand';
import type { Mission, Photo, UserProfile } from '../data/mockData';
import { MOCK_MISSIONS, MOCK_PHOTOS, MOCK_USER } from '../data/mockData';

interface AppState {
  user: UserProfile;
  token: string | null;
  isAuthenticated: boolean;
  photos: Photo[];
  missions: Mission[];
}

interface AppActions {
  login: (user: UserProfile, token: string) => void;
  logout: () => void;
  likePhoto: (photoId: string) => void;
  favoritePhoto: (photoId: string) => void;
  addPhoto: (photo: Photo) => void;
  completeMission: (missionId: string) => void;
  updateMissionProgress: (missionId: string) => void;
}

export type AppStore = AppState & AppActions;

const savedToken = localStorage.getItem('token');
const savedUser = localStorage.getItem('user');

export const useAppStore = create<AppStore>((set) => ({
  user: savedUser ? JSON.parse(savedUser) : MOCK_USER,
  token: savedToken,
  isAuthenticated: !!savedToken,
  photos: MOCK_PHOTOS,
  missions: MOCK_MISSIONS,

  login: (user, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ token: null, isAuthenticated: false, user: MOCK_USER });
  },

  likePhoto: (photoId) =>
    set((state) => ({
      photos: state.photos.map((p) => (p.id === photoId ? { ...p, likes: p.likes + 1 } : p)),
    })),

  favoritePhoto: (photoId) =>
    set((state) => ({
      photos: state.photos.map((p) =>
        p.id === photoId ? { ...p, favorites: p.favorites + 1 } : p,
      ),
    })),

  addPhoto: (photo) =>
    set((state) => ({
      photos: [photo, ...state.photos],
      user: {
        ...state.user,
        photosUploaded: state.user.photosUploaded + 1,
        points: state.user.points + 10,
      },
    })),

  completeMission: (missionId) =>
    set((state) => ({
      missions: state.missions.map((m) =>
        m.id === missionId ? { ...m, completed: true, progress: m.total } : m,
      ),
      user: {
        ...state.user,
        missionsCompleted: state.user.missionsCompleted + 1,
      },
    })),

  updateMissionProgress: (missionId) =>
    set((state) => ({
      missions: state.missions.map((m) => {
        if (m.id !== missionId || m.completed) return m;
        const newProgress = (m.progress ?? 0) + 1;
        return {
          ...m,
          progress: newProgress,
          completed: m.total ? newProgress >= m.total : false,
        };
      }),
    })),
}));
