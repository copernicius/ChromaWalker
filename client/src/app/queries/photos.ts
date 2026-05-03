import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Photo } from '../data';
import { apiCall } from '../lib';

// Server returns timestamp as an ISO string (JSON has no Date). Coerce to Date
// so consumers can call .getTime() etc. like they do with the mock data.
function hydrate(photo: Photo): Photo {
  return {
    ...photo,
    timestamp:
      photo.timestamp instanceof Date ? photo.timestamp : new Date(photo.timestamp),
  };
}

export function usePhotosQuery() {
  return useQuery({
    queryKey: ['photos'],
    queryFn: () => apiCall<Photo[]>('/api/photos'),
    select: (photos) => photos.map(hydrate),
  });
}

interface NearbyArgs {
  lat: number | null;
  lng: number | null;
  radius?: number; // meters; default 5000
}

// Returns photos sorted by distance from (lat, lng), capped at `radius`
// meters. Backed by the 2dsphere index on Photo.geo. Disabled until the
// caller supplies real coordinates (e.g. after navigator.geolocation).
export function useNearbyPhotosQuery({ lat, lng, radius = 5000 }: NearbyArgs) {
  return useQuery({
    queryKey: ['photos', 'nearby', lat, lng, radius],
    queryFn: () =>
      apiCall<Photo[]>(`/api/photos/nearby?lat=${lat}&lng=${lng}&radius=${radius}`),
    enabled: lat !== null && lng !== null,
    select: (photos) => photos.map(hydrate),
  });
}

export function useDeletePhotoMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiCall<{ id: string }>(`/api/photos/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photos'] });
      // Server reversed the user's points/counters — refetch me so the
      // store catches up.
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      // Deleting the last photo of a color re-locks the achievement.
      queryClient.invalidateQueries({ queryKey: ['my-unlocked-colors'] });
      // Same counts that drive achievements just changed.
      queryClient.invalidateQueries({ queryKey: ['my-achievements'] });
      // Mission progress likewise — deleting a contribution decrements it.
      queryClient.invalidateQueries({ queryKey: ['my-mission-progress'] });
    },
  });
}
