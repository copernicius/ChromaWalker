import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import type { Mission } from '../data';
import { apiCall, getSocket } from '../lib';
import { useAppStore } from '../store';

// ────────────────────────────────────────────────────────────────────
// Catalog (server config) — daily + solo
// ────────────────────────────────────────────────────────────────────

interface ServerMissionConfig {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'legendary';
  reward: number;
  color: string;
  target: number;
  location?: string;
  lat?: number;
  lng?: number;
}

// Adapt to the existing Mission shape so MissionCard / MissionPickerDialog
// don't need to learn a new type. `target` → `total`.
function adaptCatalog(m: ServerMissionConfig): Mission {
  return {
    id: m.id,
    title: m.title,
    description: m.description,
    difficulty: m.difficulty,
    reward: m.reward,
    color: m.color,
    total: m.target,
    progress: 0,
    completed: false,
    location: m.location,
    lat: m.lat,
    lng: m.lng,
    teamMission: false,
  };
}

export function useDailyMissionQuery() {
  return useQuery({
    queryKey: ['missions', 'daily'],
    queryFn: () => apiCall<ServerMissionConfig>('/api/missions/daily'),
    select: adaptCatalog,
    staleTime: 1000 * 60 * 60,
  });
}

export function useSoloMissionsQuery() {
  return useQuery({
    queryKey: ['missions', 'solo'],
    queryFn: () => apiCall<ServerMissionConfig[]>('/api/missions/solo'),
    select: (arr) => arr.map(adaptCatalog),
    staleTime: 1000 * 60 * 60,
  });
}

// { [missionId]: photosContributed } across all solo + daily missions for
// the current user. Pairs with mission.target to compute progress and
// completion. Skipped when not signed in.
export function useMyMissionProgressQuery() {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['my-mission-progress'],
    queryFn: () => apiCall<Record<string, number>>('/api/missions/me/progress'),
    enabled: isAuthenticated,
  });
}

// ────────────────────────────────────────────────────────────────────
// Team missions (Mongo, user-created)
// ────────────────────────────────────────────────────────────────────

export interface TeamMember {
  userId: string;
  username: string;
  avatarUrl: string;
  joinedAt: string;
  contribution: number;
}

export interface TeamMission {
  id: string;
  createdBy: string;
  // Username of the creator — denormalized server-side from members[] so the
  // client can render creator-only controls (Disband) without a User join.
  creatorUsername: string;
  title: string;
  description: string;
  color: string;
  target: number;
  reward: number;
  minSize: number;
  maxSize: number;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  members: TeamMember[];
  currentProgress: number;
  location?: string;
  lat?: number;
  lng?: number;
  startedAt?: string;
  completedAt?: string;
  timestamp: string;
}

export function useOpenTeamMissionsQuery() {
  return useQuery({
    queryKey: ['team-missions', 'open'],
    queryFn: () => apiCall<TeamMission[]>('/api/team-missions'),
  });
}

export function useMyTeamMissionsQuery() {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['team-missions', 'me'],
    queryFn: () => apiCall<TeamMission[]>('/api/team-missions/me'),
    enabled: isAuthenticated,
  });
}

// Allowed picker values for the create-team form. Sourced from the server
// (lib/teamMissionOptions) so the UI choices and the server validation can
// never drift apart.
export interface TeamMissionOptions {
  targets: number[];
  rewards: number[];
  maxSizes: number[];
}

export function useTeamMissionOptionsQuery() {
  return useQuery({
    queryKey: ['team-missions', 'options'],
    queryFn: () => apiCall<TeamMissionOptions>('/api/team-missions/options'),
    // Config is near-static but not immutable — server-side schema changes
    // (e.g. adding `maxSizes`) need to land on long-lived tabs eventually
    // without forcing a refresh. 1h is short enough to recover, long enough
    // to skip refetching on every dialog open.
    staleTime: 1000 * 60 * 60,
  });
}

interface CreateTeamMissionInput {
  title: string;
  description?: string;
  color: string;
  target: number;
  reward: number;
  maxSize: number;
  minSize?: number;
  location?: string;
  lat?: number;
  lng?: number;
}

export function useCreateTeamMissionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTeamMissionInput) =>
      apiCall<TeamMission>('/api/team-missions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-missions'] });
    },
  });
}

export function useJoinTeamMissionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiCall<TeamMission>(`/api/team-missions/${id}/join`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-missions'] });
    },
  });
}

// Server picks a random open team. Used by the shake-to-join flow.
export function useJoinRandomTeamMissionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiCall<TeamMission>('/api/team-missions/random/join', { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-missions'] });
    },
  });
}

export function useLeaveTeamMissionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiCall<TeamMission>(`/api/team-missions/${id}/leave`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-missions'] });
    },
  });
}

// ────────────────────────────────────────────────────────────────────
// Team message board
// ────────────────────────────────────────────────────────────────────

export interface TeamMessage {
  id: string;
  teamMissionId: string;
  userId: string;
  username: string;
  avatarUrl: string;
  text: string;
  timestamp: string;
}

// Members-only on the server. Pass `enabled: false` for non-members so we
// don't burn a request that's guaranteed to fail. Newest-first list — the
// UI renders in order without re-sorting.
//
// No polling: realtime updates arrive via useTeamMessageStream below.
// Initial GET fetches history; the socket handles everything thereafter.
export function useTeamMessagesQuery(teamId: string | null, enabled = true) {
  return useQuery({
    queryKey: ['team-missions', teamId, 'messages'],
    queryFn: () => apiCall<TeamMessage[]>(`/api/team-missions/${teamId}/messages`),
    enabled: !!teamId && enabled,
    refetchOnWindowFocus: true,
  });
}

// Subscribe to live message events for one team while the consumer is
// mounted and `enabled` is true. Joins `team:<id>` on the server, listens
// for `message:new`, and patches the messages query cache so the list
// reacts instantly without a refetch. De-dupes by id (the poster's own
// optimistic post may already be in the cache).
//
// Note: we deliberately don't `team:leave` on cleanup. Multiple subscribers
// (chat + per-row team:updated stream) may want the same room; rooms are
// idempotent and auto-released when the socket disconnects.
export function useTeamMessageStream(teamId: string | null, enabled: boolean) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!teamId || !enabled) return;
    const socket = getSocket();
    if (!socket) return;

    const handler = (msg: TeamMessage) => {
      if (!msg || msg.teamMissionId !== teamId) return;
      queryClient.setQueryData<TeamMessage[]>(
        ['team-missions', teamId, 'messages'],
        (prev) => {
          if (!prev) return [msg];
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [msg, ...prev];
        },
      );
    };

    const join = () => socket.emit('team:join', teamId);
    socket.on('message:new', handler);
    if (socket.connected) join();
    // Re-join after each (re)connect so transient drops self-heal.
    socket.on('connect', join);

    return () => {
      socket.off('message:new', handler);
      socket.off('connect', join);
    };
  }, [teamId, enabled, queryClient]);
}

// Live team-state updates (progress, status, member contributions) for any
// team the user is in. The server emits `team:updated` from photoController
// after each contribution; we patch myTeams + openTeams so every viewer's
// UI reflects the new state without a manual refresh.
//
// Completion handling: when status flips to 'completed' for the first time
// we (a) invalidate per-user queries the server bumped via $inc (points /
// missionsCompleted live on the User doc, not the team) and (b) call
// `onCompleted` so the row can surface a toast / celebration. Detection
// uses the previous cached entry — if the row mounted *after* completion,
// no toast fires (avoids "you completed!" on every page revisit).
export function useTeamUpdatesStream(
  teamId: string | null,
  enabled: boolean,
  onCompleted?: (team: TeamMission) => void,
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!teamId || !enabled) return;
    const socket = getSocket();
    if (!socket) return;

    const handler = (updated: TeamMission) => {
      if (!updated || updated.id !== teamId) return;

      const prevList = queryClient.getQueryData<TeamMission[]>(['team-missions', 'me']);
      const prev = prevList?.find((t) => t.id === updated.id);
      const justCompleted =
        !!prev && prev.status !== 'completed' && updated.status === 'completed';

      const replaceInList = (list: TeamMission[] | undefined) => {
        if (!list) return list;
        const idx = list.findIndex((t) => t.id === updated.id);
        if (idx === -1) return list;
        const next = list.slice();
        next[idx] = updated;
        return next;
      };

      queryClient.setQueryData<TeamMission[]>(['team-missions', 'me'], replaceInList);
      queryClient.setQueryData<TeamMission[]>(['team-missions', 'open'], replaceInList);

      if (justCompleted) {
        // The server distributed points + missionsCompleted via $inc on
        // every member, including users who weren't the uploader. Refetch
        // so headers / profiles / achievements reflect the new totals.
        queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
        queryClient.invalidateQueries({ queryKey: ['my-achievements'] });
        onCompleted?.(updated);
      }
    };

    const join = () => socket.emit('team:join', teamId);
    socket.on('team:updated', handler);
    if (socket.connected) join();
    socket.on('connect', join);

    return () => {
      socket.off('team:updated', handler);
      socket.off('connect', join);
    };
  }, [teamId, enabled, queryClient, onCompleted]);
}

export function usePostTeamMessageMutation(teamId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (text: string) =>
      apiCall<TeamMessage>(`/api/team-missions/${teamId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['team-missions', teamId, 'messages'],
      });
    },
  });
}
