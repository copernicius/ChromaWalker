import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../lib';
import type { TaskType } from './domain';

interface UploadInput {
  image: string;
  location: string;
  color: string;
  taskType: TaskType;
  missionId: string | undefined;
}

export function useUploadPhotoMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UploadInput) => {
      const res = await apiFetch('/api/photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error('Upload failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photos'] });
    },
  });
}
