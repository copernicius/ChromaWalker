import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { UserProfile } from '../data';
import { MOCK_USER } from '../data';

interface AppState {
  user: UserProfile;
  token: string | null;
  isAuthenticated: boolean;
}

interface AppActions {
  login: (user: UserProfile, token: string) => void;
  logout: () => void;
  setUser: (user: UserProfile) => void;
}

export type AppStore = AppState & AppActions;

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      user: MOCK_USER,
      token: null,
      isAuthenticated: false,

      login: (user, token) => set({ user, token, isAuthenticated: true }),

      logout: () => set({ token: null, isAuthenticated: false, user: MOCK_USER }),

      setUser: (user) => set({ user }),
    }),
    {
      name: 'chromawalk-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
