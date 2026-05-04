import { useAppStore } from '../store';
import { queryClient } from './queryClient';

// Base URL of the backend. Empty string in dev (Vite proxies `/api/*` to
// localhost:3000) or set via VITE_API_BASE_URL in production builds (e.g.
// `https://chromawalk-server.fly.dev`). Trailing slash is stripped so we
// always emit `${BASE}/api/...` cleanly.
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

function resolveUrl(input: RequestInfo): RequestInfo {
  if (typeof input !== 'string') return input;
  if (!API_BASE_URL) return input;
  // Only prepend for relative paths — leave absolute URLs untouched so
  // callers can still hit third-party services if needed.
  if (input.startsWith('/')) return `${API_BASE_URL}${input}`;
  return input;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly errno?: number,
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

  const res = await fetch(resolveUrl(input), { ...init, headers });

  if (res.status === 401) {
    useAppStore.getState().logout();
    queryClient.clear();
    throw new ApiError('Unauthorized', 401);
  }

  return res;
}

interface Envelope<T> {
  errno: number;
  errmsg: string;
  data?: T;
}

/**
 * Calls the backend and unwraps its `{ errno, errmsg, data }` envelope.
 * Throws ApiError on transport failures (401/404/5xx) or business errors
 * (errno !== 0). Returns `data` typed as T on success.
 */
export async function apiCall<T>(input: RequestInfo, init: RequestInit = {}): Promise<T> {
  const res = await apiFetch(input, init);

  if (!res.ok) {
    throw new ApiError(`HTTP ${res.status}`, res.status);
  }

  const body = (await res.json()) as Envelope<T>;
  if (body.errno !== 0) {
    throw new ApiError(body.errmsg || 'Request failed', res.status, body.errno);
  }

  return body.data as T;
}
