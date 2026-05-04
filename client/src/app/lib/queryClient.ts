import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ApiError, friendlyErrorMessage } from './api';

// Global error UX:
//
//   • Queries: show a toast on any failure. Queries don't have a per-call
//     onError in v5, so this is the only chance to surface them.
//   • Mutations: show a toast only when the caller didn't supply its own
//     onError — otherwise the mutation is presumed to handle the error
//     (most do, with their own context-specific copy).
//
// 401s are excluded — apiFetch already logs the user out and clears the
// cache on 401, and a "Please sign in" toast on top of the redirect just
// adds noise.

function isUnauthorized(err: unknown): boolean {
  return err instanceof ApiError && err.status === 401;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
  queryCache: new QueryCache({
    onError: (err) => {
      if (isUnauthorized(err)) return;
      toast.error(friendlyErrorMessage(err));
    },
  }),
  mutationCache: new MutationCache({
    onError: (err, _variables, _context, mutation) => {
      if (isUnauthorized(err)) return;
      // Caller has its own onError — they own the messaging. Skip the
      // global toast to avoid showing two.
      if (mutation.options.onError) return;
      toast.error(friendlyErrorMessage(err));
    },
  }),
});
