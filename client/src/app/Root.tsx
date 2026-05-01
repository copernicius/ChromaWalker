import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import { Navigation } from './components';
import type { UserProfile } from './data';
import { apiCall } from './lib';
import { useLevelsQuery } from './queries';
import { useAppStore } from './store';

export function Root() {
  const location = useLocation();
  const token = useAppStore((s) => s.token);
  const login = useAppStore((s) => s.login);

  // Boot-time fetches. Levels is config that everything (Home/Profile)
  // reads — kicking it off here means the cache is warm before any page
  // mounts. The hook returns the static fallback synchronously, so this
  // doesn't block render.
  useLevelsQuery();

  const meQuery = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => apiCall<UserProfile>('/api/auth/me'),
    enabled: !!token,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (meQuery.data && token) {
      login(meQuery.data, token);
    }
  }, [meQuery.data, token, login]);

  const showSplash = !!token && meQuery.isLoading;
  const hideNavigation = location.pathname === '/' || location.pathname === '/upload';

  if (showSplash) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F1ED]">
        <div className="text-gray-500 text-sm animate-pulse">Loading…</div>
      </div>
    );
  }

  return (
    <>
      <Outlet />
      {!hideNavigation && <Navigation />}
    </>
  );
}
