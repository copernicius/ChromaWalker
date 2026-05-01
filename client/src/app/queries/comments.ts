import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiCall } from '../lib';

export interface Comment {
  id: string;
  photoId: string;
  userId: string;
  username: string;
  avatarUrl: string;
  parentId: string | null;
  path: string;
  depth: number;
  text: string;
  timestamp: string;
}

// Returns all comments for a photo in DFS order. Server returns them already
// sorted by materialized path, so the client just iterates and indents by
// depth — no client-side tree-building needed.
export function useCommentsQuery(photoId: string) {
  return useQuery({
    queryKey: ['comments', photoId],
    queryFn: () => apiCall<Comment[]>(`/api/photos/${photoId}/comments`),
    enabled: !!photoId,
  });
}

interface AddCommentInput {
  text: string;
  parentId?: string;
}

export function useAddCommentMutation(photoId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ text, parentId }: AddCommentInput) =>
      apiCall<Comment>(`/api/photos/${photoId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, parentId }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', photoId] });
      // photo.comments counter changed too — keep gallery in sync.
      queryClient.invalidateQueries({ queryKey: ['photos'] });
    },
  });
}
