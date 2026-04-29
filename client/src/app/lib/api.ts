import { useAppStore } from '../store';
import { queryClient } from './queryClient';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiFetch(input: RequestInfo, init: RequestInit = {}): Promise<Response> {
  const token = useAppStore.getState().token;
  const headers = new Headers(init.headers);
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(input, { ...init, headers });

  if (res.status === 401) {
    useAppStore.getState().logout();
    queryClient.clear();
    throw new ApiError('Unauthorized', 401);
  }

  return res;
}
