import { useMutation } from '@tanstack/react-query';
import { apiCall } from '../../lib';
import type { ColorId } from './domain';

export function useDetectColorMutation() {
  return useMutation({
    mutationFn: (image: string) =>
      apiCall<{ color: ColorId }>('/api/detect-color', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image }),
      }),
  });
}
