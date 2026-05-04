import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UserProfile } from '../data';
import { apiCall, compressImage } from '../lib';
import { useAppStore } from '../store';

interface UpdateProfileInput {
  username?: string;
  avatarFile?: File;
}

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateProfileInput): Promise<UserProfile> => {
      const form = new FormData();
      if (input.username !== undefined) form.append('username', input.username);
      if (input.avatarFile) {
        // Re-encode under 500 KB before upload — same pipeline photos use.
        const compressed = await compressImage(input.avatarFile);
        const file = new File([compressed], 'avatar.jpg', { type: 'image/jpeg' });
        form.append('avatar', file);
      }
      // Don't set Content-Type — browser sets multipart boundary automatically.
      return apiCall<UserProfile>('/api/auth/me', { method: 'PATCH', body: form });
    },
    onSuccess: () => {
      // Photos denormalize username/avatarUrl, so refetch them after a profile
      // change to keep the gallery in sync.
      queryClient.invalidateQueries({ queryKey: ['photos'] });
    },
  });
}

// The set of color ids the current user has ever uploaded — drives the
// "Unlocked colors" achievements grid on Profile. Skipped when not signed
// in so it doesn't 401-loop.
export function useMyUnlockedColorsQuery() {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['my-unlocked-colors'],
    queryFn: () => apiCall<string[]>('/api/auth/me/unlocked-colors'),
    enabled: isAuthenticated,
  });
}
