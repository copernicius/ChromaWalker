// Shared mission-completion logic. Called from three places that all need
// to answer "is this user done with this catalog mission?":
//   • photoController.uploadPhoto    — deciding if this upload pays out
//   • missionsController.getMyMissionProgress — pinning displayed counts
//   • achievementsController         — counting solo missions completed
//
// Solo missions get a permanent completion lock (User.completedMissionIds).
// Daily missions stay count-based; the only re-completion exploit is bounded
// to one bonus reward per day (target is always 1).

import { findCatalogMission, type MissionConfig, SOLO_MISSIONS } from './missions';

interface UserLike {
  completedMissionIds?: string[];
}

const SOLO_IDS = new Set(SOLO_MISSIONS.map((m) => m.id));

/** Has the user permanently finished this solo mission? */
export function hasCompletedSolo(user: UserLike, missionId: string): boolean {
  return (user.completedMissionIds ?? []).includes(missionId);
}

/** Number of distinct solo missions the user has completed (achievements). */
export function countCompletedSolos(user: UserLike): number {
  return (user.completedMissionIds ?? []).filter((id) => SOLO_IDS.has(id)).length;
}

export interface UploadEvaluation {
  /** What the photo's pointsAwarded should be set to. */
  pointsAwarded: number;
  /** True iff this upload crosses the mission's target. */
  completesNow: boolean;
}

/**
 * Decide what a single contribution is worth and whether it crosses the
 * catalog mission's target. Caller is responsible for persisting completion
 * (push to user.completedMissionIds) when `completesNow` is true.
 *
 * Solo missions: permanent completion lock — no re-rewards even if
 * contribution photos are deleted. Daily missions: count-based only.
 */
export function evaluateCatalogUpload(
  user: UserLike,
  taskType: 'solo' | 'daily',
  cfg: MissionConfig,
  existingPhotoCount: number,
): UploadEvaluation {
  if (taskType === 'solo' && hasCompletedSolo(user, cfg.id)) {
    return { pointsAwarded: 0, completesNow: false };
  }
  if (existingPhotoCount + 1 === cfg.target) {
    return { pointsAwarded: cfg.reward, completesNow: true };
  }
  return { pointsAwarded: 0, completesNow: false };
}

/**
 * Mutates a progress map so completed solo missions read at >= target,
 * even if photos have been deleted. Used by GET /api/missions/me/progress.
 */
export function pinCompletedProgress(
  progress: Record<string, number>,
  user: UserLike,
): void {
  for (const id of user.completedMissionIds ?? []) {
    const cfg = findCatalogMission(id);
    if (cfg) {
      progress[id] = Math.max(progress[id] ?? 0, cfg.target);
    }
  }
}
