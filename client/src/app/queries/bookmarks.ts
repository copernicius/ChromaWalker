import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Photo } from '../data';
import { apiCall } from '../lib';
import { useAppStore } from '../store';

// Returns the photoIds the current user has bookmarked. Skipped when not
// signed in so we don't 401 / wipe the store.
export function useMyBookmarksQuery() {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['my-bookmarks'],
    queryFn: () => apiCall<string[]>('/api/photos/me/bookmarks'),
    enabled: isAuthenticated,
  });
}

interface ToggleBookmarkInput {
  id: string;
  bookmark: boolean; // true → POST, false → DELETE
}

interface ToggleBookmarkContext {
  prevBookmarks: string[] | undefined;
  prevPhotos: Photo[] | undefined;
}

export function useToggleBookmarkMutation() {
  const queryClient = useQueryClient();
  return useMutation<
    { id: string; favorites: number },
    Error,
    ToggleBookmarkInput,
    ToggleBookmarkContext
  >({
    mutationFn: ({ id, bookmark }) =>
      apiCall<{ id: string; favorites: number }>(`/api/photos/${id}/bookmark`, {
        method: bookmark ? 'POST' : 'DELETE',
      }),
    onMutate: async ({ id, bookmark }) => {
      await queryClient.cancelQueries({ queryKey: ['my-bookmarks'] });
      await queryClient.cancelQueries({ queryKey: ['photos'] });

      const prevBookmarks = queryClient.getQueryData<string[]>(['my-bookmarks']);
      const prevPhotos = queryClient.getQueryData<Photo[]>(['photos']);

      if (prevBookmarks) {
        queryClient.setQueryData<string[]>(
          ['my-bookmarks'],
          bookmark ? [...prevBookmarks, id] : prevBookmarks.filter((p) => p !== id),
        );
      }

      if (prevPhotos) {
        queryClient.setQueryData<Photo[]>(['photos'], (photos) =>
          photos?.map((p) =>
            p.id === id
              ? { ...p, favorites: Math.max(0, p.favorites + (bookmark ? 1 : -1)) }
              : p,
          ),
        );
      }

      return { prevBookmarks, prevPhotos };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prevBookmarks !== undefined) {
        queryClient.setQueryData(['my-bookmarks'], ctx.prevBookmarks);
      }
      if (ctx?.prevPhotos !== undefined) {
        queryClient.setQueryData(['photos'], ctx.prevPhotos);
      }
    },
    onSuccess: (data, { id }) => {
      // Server returned the authoritative count. Patch only that one photo
      // in the cache instead of refetching the gallery.
      queryClient.setQueryData<Photo[]>(['photos'], (photos) =>
        photos?.map((p) => (p.id === id ? { ...p, favorites: data.favorites } : p)),
      );
    },
  });
}
