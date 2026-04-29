import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import { Navigation } from './components';
import type { UserProfile } from './data';
import { apiFetch } from './lib';
import { useAppStore } from './store';

export function Root() {
  const location = useLocation();
  const token = useAppStore((s) => s.token);
  const login = useAppStore((s) => s.login);

  const meQuery = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const res = await apiFetch('/api/auth/me');
      if (!res.ok) throw new Error('Failed to fetch user');
      return (await res.json()) as UserProfile;
    },
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
