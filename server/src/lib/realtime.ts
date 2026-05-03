// Socket.IO infrastructure shared across realtime features. Today: team
// chat. Future: shake-to-find-teammate (a per-user signaling channel).
//
// Design:
//   • Single io instance, attached to the same HTTP server as Express.
//   • JWT handshake auth — same secret as the REST middleware. Rejected
//     handshakes never reach our event handlers.
//   • Two room conventions:
//       team:<teamMissionId>   — broadcast to a team's members
//       user:<userId>          — direct send to one user (auto-joined)
//   • Membership re-checked against Mongo on every team join (the JWT only
//     proves identity, not authorization).
//
// Controllers should call `emitToTeam` / `emitToUser` rather than touching
// `io` directly so the underlying transport stays swappable.

import type { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { Server as IOServer, type DefaultEventsMap, type Socket } from 'socket.io';
import { JWT_SECRET } from '../middleware/auth';
import TeamMission from '../models/TeamMission';

interface SocketData {
  userId: string;
}

// We don't enforce per-event payload schemas — keep all four generics on
// the loose default map so handlers/emitters can use string event names
// freely. Tighten only if a feature grows complex enough to want it.
type IO = IOServer<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, SocketData>;

let io: IO | null = null;

export function initRealtime(httpServer: HTTPServer): void {
  io = new IOServer<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, SocketData>(httpServer, {
    cors: { origin: true, credentials: true },
    // Polling + websockets — Vite dev server proxies both, and most users
    // can upgrade to WS within a second of connecting.
    transports: ['websocket', 'polling'],
  });

  // Handshake auth: token comes via `auth.token` (set by client) so it's
  // not in the URL and not in headers (Engine.IO can't easily set headers
  // for WebSocket transport in browsers).
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error('missing token'));
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
      socket.data.userId = decoded.id;
      next();
    } catch {
      next(new Error('invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.userId;
    // Auto-join the per-user room so emitToUser works without further
    // client cooperation.
    socket.join(`user:${userId}`);

    socket.on('team:join', async (rawId: unknown, ack?: (ok: boolean, err?: string) => void) => {
      try {
        const teamId = String(rawId ?? '');
        if (!mongoose.isValidObjectId(teamId)) {
          ack?.(false, 'invalid team id');
          return;
        }
        // Re-validate membership on every join — the JWT only proves who
        // the user is, not what teams they belong to right now.
        const team = await TeamMission.findById(teamId).select('members.userId');
        if (!team) {
          ack?.(false, 'team not found');
          return;
        }
        if (!team.members.some((m) => String(m.userId) === userId)) {
          ack?.(false, 'not a member');
          return;
        }
        socket.join(`team:${teamId}`);
        ack?.(true);
      } catch (err) {
        console.error('team:join failed:', err);
        ack?.(false, 'server error');
      }
    });

    socket.on('team:leave', (rawId: unknown) => {
      const teamId = String(rawId ?? '');
      if (mongoose.isValidObjectId(teamId)) {
        socket.leave(`team:${teamId}`);
      }
    });
  });
}

export function emitToTeam(teamId: string, event: string, payload: unknown): void {
  if (!io) return;
  io.to(`team:${teamId}`).emit(event, payload);
}

// Reserved for future per-user features (e.g. shake-to-find-teammate match
// notifications). Not used yet — keeping it surfaced so handlers can adopt
// it without re-reading this file.
export function emitToUser(userId: string, event: string, payload: unknown): void {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, payload);
}

// Type-only re-export so callers don't have to import socket.io directly.
export type RealtimeSocket = Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, SocketData>;
