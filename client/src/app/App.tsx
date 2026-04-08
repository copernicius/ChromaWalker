import { RouterProvider } from 'react-router';
import { ErrorBoundary } from './components/ErrorBoundary';
import { router } from './routes';

export const App = () => {
  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  );
};
