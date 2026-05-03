import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Photo } from '../data';
import { apiCall } from '../lib';
import { useAppStore } from '../store';

// Returns the photoIds the current user has liked. Skipped when not signed in
// so it doesn't trigger a 401 / store wipe in apiFetch.
export function useMyLikesQuery() {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['my-likes'],
    queryFn: () => apiCall<string[]>('/api/photos/me/likes'),
    enabled: isAuthenticated,
  });
}

interface ToggleLikeInput {
  id: string;
  like: boolean; // true → POST /like, false → DELETE /like
}

interface ToggleLikeContext {
  prevLikes: string[] | undefined;
  prevPhotos: Photo[] | undefined;
}

// Optimistic toggle: bumps the photo's like count and the user's likes set
// immediately on click, rolls back on error, and refetches both on settle.
export function useToggleLikeMutation() {
  const queryClient = useQueryClient();
  return useMutation<{ id: string; likes: number }, Error, ToggleLikeInput, ToggleLikeContext>({
    mutationFn: ({ id, like }) =>
      apiCall<{ id: string; likes: number }>(`/api/photos/${id}/like`, {
        method: like ? 'POST' : 'DELETE',
      }),
    onMutate: async ({ id, like }) => {
      await queryClient.cancelQueries({ queryKey: ['my-likes'] });
      await queryClient.cancelQueries({ queryKey: ['photos'] });

      const prevLikes = queryClient.getQueryData<string[]>(['my-likes']);
      const prevPhotos = queryClient.getQueryData<Photo[]>(['photos']);

      if (prevLikes) {
        queryClient.setQueryData<string[]>(
          ['my-likes'],
          like ? [...prevLikes, id] : prevLikes.filter((p) => p !== id),
        );
      }

      if (prevPhotos) {
        queryClient.setQueryData<Photo[]>(['photos'], (photos) =>
          photos?.map((p) =>
            p.id === id
              ? { ...p, likes: Math.max(0, p.likes + (like ? 1 : -1)) }
              : p,
          ),
        );
      }

      return { prevLikes, prevPhotos };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prevLikes !== undefined) {
        queryClient.setQueryData(['my-likes'], ctx.prevLikes);
      }
      if (ctx?.prevPhotos !== undefined) {
        queryClient.setQueryData(['photos'], ctx.prevPhotos);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['my-likes'] });
      queryClient.invalidateQueries({ queryKey: ['photos'] });
      // Likes given (heart on someone else's photo) and likes received both
      // feed achievement progress; safe to invalidate on either direction.
      queryClient.invalidateQueries({ queryKey: ['my-achievements'] });
    },
  });
}
