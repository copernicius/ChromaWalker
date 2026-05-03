import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { Navigation } from './components';
import type { UserProfile } from './data';
import { apiCall } from './lib';
import { useLevelsQuery } from './queries';
import { useAppStore } from './store';

// Welcome is the only page reachable without a session — every other route
// is gated behind `isAuthenticated`. Add new public paths here if needed.
const PUBLIC_PATHS = new Set(['/']);

export function Root() {
  const location = useLocation();
  const token = useAppStore((s) => s.token);
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
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

  // Auth gate. Once we're past the splash we know the auth state for sure
  // (no token → false; valid token → meQuery resolved → true; invalid token
  // → apiFetch's 401 handler already flipped both to false). Anyone landing
  // on a non-public route without a session goes back to Welcome.
  if (!isAuthenticated && !PUBLIC_PATHS.has(location.pathname)) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <Outlet />
      {!hideNavigation && <Navigation />}
    </>
  );
}
