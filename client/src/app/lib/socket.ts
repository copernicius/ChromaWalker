// Singleton Socket.IO client. Lazily connects with the current JWT and
// reconnects when the token changes (login/logout). Consumers should treat
// the returned socket as eternal — it will (re)connect on demand and
// auto-reconnect on transient drops.
//
// Token plumbing: pulled from the same zustand store as the REST client so
// realtime auth and HTTP auth stay in lockstep.

import { io as ioClient, type Socket } from 'socket.io-client';
import { useAppStore } from '../store';

let socket: Socket | null = null;
let lastToken: string | null = null;

function buildSocket(token: string): Socket {
  // Empty URL = connect to the page origin. Vite dev proxies /socket.io to
  // the server; in prod the same origin serves both.
  return ioClient({
    auth: { token },
    autoConnect: true,
    transports: ['websocket', 'polling'],
  });
}

export function getSocket(): Socket | null {
  const token = useAppStore.getState().token;
  if (!token) {
    // No identity → no socket. Tear down any stale one to avoid leaking
    // post-logout connections.
    if (socket) {
      socket.disconnect();
      socket = null;
      lastToken = null;
    }
    return null;
  }

  if (!socket || token !== lastToken) {
    if (socket) socket.disconnect();
    socket = buildSocket(token);
    lastToken = token;
  }
  return socket;
}

// Re-evaluate the socket when the auth token changes. Subscribe once at app
// boot (called from main.tsx) so login/logout reliably tears down or
// reconnects the realtime channel.
export function watchAuthForSocket(): void {
  useAppStore.subscribe((state, prev) => {
    if (state.token !== prev.token) {
      // getSocket internally handles teardown for null-token and rebuild
      // for changed-token. Calling it triggers either path.
      getSocket();
    }
  });
}
