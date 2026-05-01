import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Photo } from '../../data';
import { apiCall } from '../../lib';
import type { TaskType } from './domain';

interface UploadInput {
  image: string; // data URL from PhotoCapture
  color: string;
  taskType: TaskType;
  missionId: string | undefined;
  location: string;
  lat?: number;
  lng?: number;
  caption: string;
  pointsAwarded: number;
}

async function dataUrlToFile(dataUrl: string): Promise<File> {
  const blob = await fetch(dataUrl).then((r) => r.blob());
  const ext = (blob.type.split('/')[1] ?? 'jpg').split(';')[0];
  return new File([blob], `photo.${ext}`, { type: blob.type || 'image/jpeg' });
}

export function useUploadPhotoMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UploadInput): Promise<Photo> => {
      const file = await dataUrlToFile(input.image);

      const form = new FormData();
      form.append('image', file);
      form.append('color', input.color);
      form.append('taskType', input.taskType ?? '');
      if (input.missionId) form.append('missionId', input.missionId);
      form.append('location', input.location);
      if (input.lat !== undefined) form.append('lat', String(input.lat));
      if (input.lng !== undefined) form.append('lng', String(input.lng));
      if (input.caption) form.append('caption', input.caption);
      form.append('pointsAwarded', String(input.pointsAwarded));

      // Don't set Content-Type — browser sets multipart boundary automatically.
      return apiCall<Photo>('/api/photos/upload', { method: 'POST', body: form });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photos'] });
      // Server bumped user.points / photosUploaded / missionsCompleted —
      // refetch /api/auth/me so Root.tsx writes the fresh user into the
      // zustand store (Header, Profile counters, level progress all read it).
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
}
