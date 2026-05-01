import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UserProfile } from '../data';
import { apiCall } from '../lib';

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
      if (input.avatarFile) form.append('avatar', input.avatarFile);
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
