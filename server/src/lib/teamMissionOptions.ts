// Allowed values for user-created team missions. Both arrays are exposed
// via GET /api/team-missions/options so the client can render the same
// fixed choices (no free-form number inputs) and validated server-side at
// creation time so a tampered request can't bypass the picker.

export const TEAM_MISSION_TARGET_OPTIONS = [5, 10, 15, 20] as const;
export const TEAM_MISSION_REWARD_OPTIONS = [100, 200, 300] as const;
export const TEAM_MISSION_MAX_SIZE_OPTIONS = [3, 5, 7] as const;

export type TeamMissionTarget = (typeof TEAM_MISSION_TARGET_OPTIONS)[number];
export type TeamMissionReward = (typeof TEAM_MISSION_REWARD_OPTIONS)[number];
export type TeamMissionMaxSize = (typeof TEAM_MISSION_MAX_SIZE_OPTIONS)[number];

export function isAllowedTarget(n: number): n is TeamMissionTarget {
  return (TEAM_MISSION_TARGET_OPTIONS as readonly number[]).includes(n);
}

export function isAllowedReward(n: number): n is TeamMissionReward {
  return (TEAM_MISSION_REWARD_OPTIONS as readonly number[]).includes(n);
}

export function isAllowedMaxSize(n: number): n is TeamMissionMaxSize {
  return (TEAM_MISSION_MAX_SIZE_OPTIONS as readonly number[]).includes(n);
}
