import { useMutation } from '@tanstack/react-query';
import { RAINBOW_COLORS } from '../../data';
import type { ColorId } from './domain';

// Stub: simulates ML color detection. Replace mutationFn with a real
// `apiFetch('/api/detect-color', ...)` once the endpoint exists.
export function useDetectColorMutation() {
  return useMutation({
    mutationFn: async (_image: string): Promise<{ color: ColorId }> => {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const random = RAINBOW_COLORS[Math.floor(Math.random() * RAINBOW_COLORS.length)];
      return { color: random.id };
    },
  });
}
