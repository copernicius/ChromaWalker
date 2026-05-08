import { useAppStore } from "../store";
import { queryClient } from "./queryClient";

// Base URL of the backend. Empty string in dev (Vite proxies `/api/*` to
// localhost:3000) or set via VITE_API_BASE_URL in production builds (e.g.
// `https://chromawalk2.fly.dev`). Trailing slash is stripped so we
// always emit `${BASE}/api/...` cleanly.
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(
  /\/$/,
  "",
);

function resolveUrl(input: RequestInfo): RequestInfo {
  if (typeof input !== "string") return input;
  if (!API_BASE_URL) return input;
  // Only prepend for relative paths — leave absolute URLs untouched so
  // callers can still hit third-party services if needed.
  if (input.startsWith("/")) return `${API_BASE_URL}${input}`;
  return input;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly errno?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Mirrors server/src/lib/response.ts ErrCode. Kept as plain strings so a
// non-zero errno from any endpoint produces something readable rather
// than dumping a raw errmsg or 'Request failed'.
const FRIENDLY_BY_ERRNO: Record<number, string> = {
  1001: "Some required information is missing.",
  1002: "That doesn't look right — please double-check and try again.",
  1003: "We couldn't find what you were looking for.",
  1004: "Please sign in to continue.",
  1005: "No results yet.",
};

/**
 * Best message for a UI toast. Prefers the server's own errmsg when it
 * looks human (the controllers write things like "Title is required (1–100
 * chars)"), falling back to an errno-mapped phrase, then a generic last
 * resort. Network/HTTP transport errors get their own friendly defaults.
 */
export function friendlyErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    // Server-supplied message is usually already user-facing — prefer it
    // unless it's the placeholder we generate ourselves for HTTP failures.
    const serverMsg = err.message;
    const looksLikeServerMsg =
      serverMsg &&
      !serverMsg.startsWith("HTTP ") &&
      serverMsg !== "Request failed";
    if (looksLikeServerMsg) return serverMsg;
    if (err.errno && FRIENDLY_BY_ERRNO[err.errno]) {
      return FRIENDLY_BY_ERRNO[err.errno];
    }
    if (err.status >= 500) {
      return "Something went wrong on our end. Please try again in a moment.";
    }
    return "Something went wrong. Please try again.";
  }
  if (err instanceof Error) {
    // Fetch / network failures (offline, DNS, CORS) end up here.
    return "Network error — check your connection and try again.";
  }
  return "Unexpected error. Please try again.";
}

export async function apiFetch(
  input: RequestInfo,
  init: RequestInit = {},
): Promise<Response> {
  const token = useAppStore.getState().token;
  const headers = new Headers(init.headers);
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(resolveUrl(input), { ...init, headers });

  if (res.status === 401) {
    useAppStore.getState().logout();
    queryClient.clear();
    throw new ApiError("Unauthorized", 401);
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
export async function apiCall<T>(
  input: RequestInfo,
  init: RequestInit = {},
): Promise<T> {
  const res = await apiFetch(input, init);

  if (!res.ok) {
    throw new ApiError(`HTTP ${res.status}`, res.status);
  }

  const body = (await res.json()) as Envelope<T>;
  if (body.errno !== 0) {
    throw new ApiError(body.errmsg || "Request failed", res.status, body.errno);
  }

  return body.data as T;
}
