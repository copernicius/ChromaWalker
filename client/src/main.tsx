import { createRoot } from 'react-dom/client';
import { App } from './app/App.tsx';
import './styles/index.css';

async function bootstrap() {
  if (import.meta.env.DEV) {
    try {
      const { worker } = await import('./mocks/browser');
      await worker.start({ onUnhandledRequest: 'bypass' });
    } catch (err) {
      console.warn('MSW failed to start (expected with self-signed SSL):', err);
    }
  }

  const rootElement = document.getElementById('root');
  if (!rootElement) throw new Error('Root element not found');
  createRoot(rootElement).render(<App />);
}

bootstrap();
