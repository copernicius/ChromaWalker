import { Outlet, useLocation } from 'react-router';
import { Navigation } from './components/Navigation';

export function Root() {
  const location = useLocation();
  const hideNavigation = location.pathname === '/' || location.pathname === '/upload';

  return (
    <>
      <Outlet />
      {!hideNavigation && <Navigation />}
    </>
  );
}