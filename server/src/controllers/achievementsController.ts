import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { ACHIEVEMENTS, type AchievementKind } from '../lib/achievements';
import { countCompletedSolos } from '../lib/missionProgress';
import { ErrCode, fail, ok } from '../lib/response';
import Like from '../models/Like';
import Photo from '../models/Photo';
import TeamMission from '../models/TeamMission';
import User from '../models/User';

interface UserStats {
  distinct_locations: number;
  photos_uploaded: number;
  missions_completed_solo: number;
  missions_completed_team: number;
  colors_unlocked: number;
  likes_given: number;
  likes_received: number;
}

// One round-trip per metric. Cheap for a profile load, but trivially
// extractable into a single $facet aggregation if it ever matters.
async function computeUserStats(
  userId: mongoose.Types.ObjectId,
): Promise<UserStats> {
  const [
    photos_uploaded,
    distinct_locations,
    colors_unlocked,
    user,
    missions_completed_team,
    likes_given,
    likesReceivedAgg,
  ] = await Promise.all([
    Photo.countDocuments({ userId }),
    Photo.distinct('location', { userId }).then((arr) => arr.length),
    Photo.distinct('color', { userId }).then((arr) => arr.length),
    // Solo completions live on the User doc as a permanent record — using
    // them here means deleting contributions doesn't decrement the
    // achievement counter (matching the "what's done is done" rule).
    User.findById(userId).select('completedMissionIds'),
    // Team missions actually finished where this user was a member.
    TeamMission.countDocuments({
      status: 'completed',
      'members.userId': userId,
    }),
    Like.countDocuments({ userId }),
    Photo.aggregate<{ total: number }>([
      { $match: { userId } },
      { $group: { _id: null, total: { $sum: '$likes' } } },
    ]),
  ]);

  const missions_completed_solo = countCompletedSolos(user ?? {});

  return {
    photos_uploaded,
    distinct_locations,
    colors_unlocked,
    missions_completed_solo,
    missions_completed_team,
    likes_given,
    likes_received: likesReceivedAgg[0]?.total ?? 0,
  };
}

// GET /api/achievements/me  (auth-gated)
export async function getMyAchievements(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      fail(res, ErrCode.AUTH_FAILED, 'Authentication required');
      return;
    }

    const stats = await computeUserStats(new mongoose.Types.ObjectId(userId));

    const hydrated = ACHIEVEMENTS.map((cfg) => {
      const raw = stats[cfg.kind as AchievementKind] ?? 0;
      // Cap progress at total so the bar never overshoots.
      const progress = Math.min(raw, cfg.total);
      return {
        id: cfg.id,
        name: cfg.name,
        description: cfg.description,
        icon: cfg.icon,
        total: cfg.total,
        progress,
        unlocked: raw >= cfg.total,
      };
    });

    ok(res, hydrated);
  } catch (err) {
    console.error('Failed to fetch achievements:', err);
    res.status(500).json({ errno: 500, errmsg: 'Failed to fetch achievements' });
  }
}
