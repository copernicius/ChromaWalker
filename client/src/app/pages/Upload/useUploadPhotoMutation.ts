import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Photo } from '../../data';
import { apiCall } from '../../lib';
import type { TaskType } from './domain';

interface UploadInput {
  // Data URL holding an already-compressed JPEG. Compression happens once
  // upstream in Upload/index.tsx handleSelectPhoto so the same bytes feed
  // both /api/detect-color and /api/photos/upload.
  image: string;
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
  return new File([blob], 'photo.jpg', { type: 'image/jpeg' });
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
      // Newly-uploaded color may have just been unlocked.
      queryClient.invalidateQueries({ queryKey: ['my-unlocked-colors'] });
      // Counts photos / locations / colors / missions — all achievement inputs.
      queryClient.invalidateQueries({ queryKey: ['my-achievements'] });
      // Per-mission progress (1/3 → 2/3) shifts on every catalog upload.
      queryClient.invalidateQueries({ queryKey: ['my-mission-progress'] });
      // Team missions: server bumps currentProgress / member.contribution
      // for taskType=team uploads, and may flip status to 'completed' once
      // the target is hit. Invalidating the whole namespace covers the open
      // list, the user's teams, and any per-team detail/queries.
      queryClient.invalidateQueries({ queryKey: ['team-missions'] });
    },
  });
}
