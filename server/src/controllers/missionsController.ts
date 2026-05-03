import type { Request, Response } from "express";
import mongoose from "mongoose";
import { pinCompletedProgress } from "../lib/missionProgress";
import {
  pickTodaysDailyMission,
  SOLO_MISSIONS,
} from "../lib/missions";
import { ErrCode, fail, ok } from "../lib/response";
import Photo from "../models/Photo";
import User from "../models/User";

// GET /api/missions/daily — today's daily mission (one entry, server-rotated)
export function getDailyMission(_req: Request, res: Response): void {
  ok(res, pickTodaysDailyMission());
}

// GET /api/missions/solo — full catalog of solo missions
export function getSoloMissions(_req: Request, res: Response): void {
  ok(res, SOLO_MISSIONS);
}

// GET /api/missions/me/progress  (auth-gated)
// Returns { [missionId]: contributionCount } for every solo/daily mission
// the user has uploaded any photo for. Counts derived from Photo records;
// no separate progress collection. Caller compares against MissionConfig.target
// to decide if a mission is complete.
export async function getMyMissionProgress(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      fail(res, ErrCode.AUTH_FAILED, "Authentication required");
      return;
    }

    const oid = new mongoose.Types.ObjectId(userId);
    const [aggs, user] = await Promise.all([
      Photo.aggregate<{ _id: string; count: number }>([
        {
          $match: {
            userId: oid,
            taskType: { $in: ["solo", "daily"] },
            missionId: { $exists: true, $ne: null },
          },
        },
        { $group: { _id: "$missionId", count: { $sum: 1 } } },
      ]),
      User.findById(oid).select("completedMissionIds"),
    ]);

    const progress: Record<string, number> = {};
    for (const a of aggs) progress[a._id] = a.count;

    // Pin permanently-completed solos at >= target so deletes don't
    // visually un-complete them. (Logic shared with photoController +
    // achievementsController via lib/missionProgress.)
    pinCompletedProgress(progress, user ?? {});

    ok(res, progress);
  } catch (err) {
    console.error("Failed to fetch mission progress:", err);
    res
      .status(500)
      .json({ errno: 500, errmsg: "Failed to fetch mission progress" });
  }
}
