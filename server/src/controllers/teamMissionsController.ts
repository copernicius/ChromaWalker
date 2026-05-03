import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { PALETTE_IDS } from '../lib/palette';
import { ErrCode, fail, ok } from '../lib/response';
import {
  isAllowedMaxSize,
  isAllowedReward,
  isAllowedTarget,
  TEAM_MISSION_MAX_SIZE_OPTIONS,
  TEAM_MISSION_REWARD_OPTIONS,
  TEAM_MISSION_TARGET_OPTIONS,
} from '../lib/teamMissionOptions';
import { emitToTeam } from '../lib/realtime';
import TeamMessage from '../models/TeamMessage';
import TeamMission from '../models/TeamMission';
import User from '../models/User';

const MESSAGE_PAGE_SIZE = 100;

// GET /api/team-missions/options — allowed picker values for the create form.
export function getTeamMissionOptions(_req: Request, res: Response): void {
  ok(res, {
    targets: TEAM_MISSION_TARGET_OPTIONS,
    rewards: TEAM_MISSION_REWARD_OPTIONS,
    maxSizes: TEAM_MISSION_MAX_SIZE_OPTIONS,
  });
}

// Single-team rule: a user is "in a team" iff they're a member of any
// open or in_progress mission. Completed/cancelled don't lock them out.
// Used to gate both create and join.
async function findActiveTeamForUser(userId: string) {
  return TeamMission.findOne({
    'members.userId': new mongoose.Types.ObjectId(userId),
    status: { $in: ['open', 'in_progress'] },
  });
}

// GET /api/team-missions — open teams, newest first.
export async function listOpenTeamMissions(
  _req: Request,
  res: Response,
): Promise<void> {
  try {
    const teams = await TeamMission.find({ status: 'open' }).sort({
      createdAt: -1,
    });
    ok(res, teams);
  } catch (err) {
    console.error('Failed to list team missions:', err);
    res
      .status(500)
      .json({ errno: 500, errmsg: 'Failed to list team missions' });
  }
}

// GET /api/team-missions/me — teams the user is in (any status).
export async function listMyTeamMissions(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      fail(res, ErrCode.AUTH_FAILED, 'Authentication required');
      return;
    }
    const teams = await TeamMission.find({
      'members.userId': new mongoose.Types.ObjectId(userId),
    }).sort({ createdAt: -1 });
    ok(res, teams);
  } catch (err) {
    console.error('Failed to list my team missions:', err);
    res
      .status(500)
      .json({ errno: 500, errmsg: 'Failed to list my team missions' });
  }
}

// GET /api/team-missions/:id
export async function getTeamMission(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const id = req.params.id;
    if (typeof id !== 'string' || !mongoose.isValidObjectId(id)) {
      fail(res, ErrCode.INVALID_PARAM, 'Invalid team mission id');
      return;
    }
    const team = await TeamMission.findById(id);
    if (!team) {
      fail(res, ErrCode.NOT_FOUND, 'Team mission not found');
      return;
    }
    ok(res, team);
  } catch (err) {
    console.error('Failed to fetch team mission:', err);
    res
      .status(500)
      .json({ errno: 500, errmsg: 'Failed to fetch team mission' });
  }
}

// POST /api/team-missions  (auth)
// Body: { title, description?, color, target, reward, minSize?, maxSize?,
//         location?, lat?, lng? }
// Creator is auto-added as the first member.
export async function createTeamMission(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      fail(res, ErrCode.AUTH_FAILED, 'Authentication required');
      return;
    }

    const {
      title,
      description,
      color,
      target,
      reward,
      minSize,
      maxSize,
      location,
      lat,
      lng,
    } = (req.body || {}) as {
      title?: string;
      description?: string;
      color?: string;
      target?: number;
      reward?: number;
      minSize?: number;
      maxSize?: number;
      location?: string;
      lat?: number;
      lng?: number;
    };

    const trimmedTitle = title?.trim() ?? '';
    if (trimmedTitle.length === 0 || trimmedTitle.length > 100) {
      fail(res, ErrCode.INVALID_PARAM, 'Title is required (1–100 chars)');
      return;
    }
    // Team missions must commit to a single palette color (no "rainbow" wildcard
    // for user-created teams) and use the fixed picker values from
    // lib/teamMissionOptions — keeps validation in lockstep with the client UI.
    if (!color || !PALETTE_IDS.has(color)) {
      fail(res, ErrCode.INVALID_PARAM, 'Invalid color');
      return;
    }
    const targetN = Number(target);
    if (!Number.isFinite(targetN) || !isAllowedTarget(targetN)) {
      fail(
        res,
        ErrCode.INVALID_PARAM,
        `target must be one of ${TEAM_MISSION_TARGET_OPTIONS.join(', ')}`,
      );
      return;
    }
    const rewardN = Number(reward);
    if (!Number.isFinite(rewardN) || !isAllowedReward(rewardN)) {
      fail(
        res,
        ErrCode.INVALID_PARAM,
        `reward must be one of ${TEAM_MISSION_REWARD_OPTIONS.join(', ')}`,
      );
      return;
    }
    const maxSizeN = Number(maxSize);
    if (!Number.isFinite(maxSizeN) || !isAllowedMaxSize(maxSizeN)) {
      fail(
        res,
        ErrCode.INVALID_PARAM,
        `maxSize must be one of ${TEAM_MISSION_MAX_SIZE_OPTIONS.join(', ')}`,
      );
      return;
    }

    // Single-team rule: can't create while you're already in one (whether
    // you created it or joined it). Forces explicit completion before
    // starting a new mission.
    const existing = await findActiveTeamForUser(userId);
    if (existing) {
      fail(
        res,
        ErrCode.INVALID_PARAM,
        'You are already in a team mission. Finish your current one first.',
      );
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      fail(res, ErrCode.NOT_FOUND, 'User not found');
      return;
    }

    const team = await TeamMission.create({
      createdBy: user._id,
      title: trimmedTitle,
      description: description?.trim().slice(0, 500) ?? '',
      color,
      target: targetN,
      reward: rewardN,
      minSize: minSize ?? 2,
      maxSize: maxSizeN,
      status: 'open',
      members: [
        {
          userId: user._id,
          username: user.username,
          avatarUrl: user.avatarUrl,
          joinedAt: new Date(),
          contribution: 0,
        },
      ],
      currentProgress: 0,
      location,
      lat,
      lng,
    });

    ok(res, team);
  } catch (err) {
    console.error('Create team mission failed:', err);
    res.status(500).json({ errno: 500, errmsg: 'Create team mission failed' });
  }
}

// POST /api/team-missions/random/join  (auth)
// Pick a random open team the user isn't already in and isn't full, then
// add them as a member. Atomic enough for class-project scale: $sample +
// re-validate via the same code path as a normal join. Powers the
// "shake to join" feature on the client.
export async function joinRandomTeamMission(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      fail(res, ErrCode.AUTH_FAILED, 'Authentication required');
      return;
    }

    const existing = await findActiveTeamForUser(userId);
    if (existing) {
      fail(
        res,
        ErrCode.INVALID_PARAM,
        'You are already in a team mission. Finish your current one first.',
      );
      return;
    }

    const oid = new mongoose.Types.ObjectId(userId);
    const candidates = await TeamMission.aggregate<{ _id: mongoose.Types.ObjectId }>([
      {
        $match: {
          status: 'open',
          $expr: { $lt: [{ $size: '$members' }, '$maxSize'] },
          'members.userId': { $ne: oid },
        },
      },
      { $sample: { size: 1 } },
      { $project: { _id: 1 } },
    ]);

    if (candidates.length === 0) {
      fail(res, ErrCode.NOT_FOUND, 'No open teams to join right now');
      return;
    }

    const team = await TeamMission.findById(candidates[0]._id);
    if (!team) {
      // Race: team was disbanded between $sample and findById.
      fail(res, ErrCode.NOT_FOUND, 'Team disappeared, please shake again');
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      fail(res, ErrCode.NOT_FOUND, 'User not found');
      return;
    }

    team.members.push({
      userId: user._id as mongoose.Types.ObjectId,
      username: user.username,
      avatarUrl: user.avatarUrl,
      joinedAt: new Date(),
      contribution: 0,
    });

    if (team.members.length * 2 > team.maxSize) {
      team.status = 'in_progress';
      team.startedAt = new Date();
    }

    await team.save();
    ok(res, team);
  } catch (err) {
    console.error('Random join failed:', err);
    res.status(500).json({ errno: 500, errmsg: 'Random join failed' });
  }
}

// POST /api/team-missions/:id/join  (auth)
// Auto-starts when members.length reaches minSize.
export async function joinTeamMission(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      fail(res, ErrCode.AUTH_FAILED, 'Authentication required');
      return;
    }
    const id = req.params.id;
    if (typeof id !== 'string' || !mongoose.isValidObjectId(id)) {
      fail(res, ErrCode.INVALID_PARAM, 'Invalid team mission id');
      return;
    }

    const team = await TeamMission.findById(id);
    if (!team) {
      fail(res, ErrCode.NOT_FOUND, 'Team mission not found');
      return;
    }
    if (team.status !== 'open') {
      fail(res, ErrCode.INVALID_PARAM, 'Team is no longer accepting members');
      return;
    }
    if (team.members.length >= team.maxSize) {
      fail(res, ErrCode.INVALID_PARAM, 'Team is full');
      return;
    }
    if (team.members.some((m) => String(m.userId) === userId)) {
      fail(res, ErrCode.INVALID_PARAM, 'Already a member');
      return;
    }
    // Single-team rule: also can't join a second team while another is
    // open/in_progress.
    const existing = await findActiveTeamForUser(userId);
    if (existing) {
      fail(
        res,
        ErrCode.INVALID_PARAM,
        'You are already in a team mission. Finish your current one first.',
      );
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      fail(res, ErrCode.NOT_FOUND, 'User not found');
      return;
    }

    team.members.push({
      userId: user._id as mongoose.Types.ObjectId,
      username: user.username,
      avatarUrl: user.avatarUrl,
      joinedAt: new Date(),
      contribution: 0,
    });

    // Auto-start once strictly more than half the seats are filled. Threshold
    // is derived from maxSize alone (minSize is no longer load-bearing for
    // start, kept on the model only because old documents may still set it).
    if (team.members.length * 2 > team.maxSize) {
      team.status = 'in_progress';
      team.startedAt = new Date();
    }

    await team.save();
    ok(res, team);
  } catch (err) {
    console.error('Join team mission failed:', err);
    res.status(500).json({ errno: 500, errmsg: 'Join team mission failed' });
  }
}

// POST /api/team-missions/:id/leave  (auth)
// Only the creator can leave — and doing so destroys the team. Joiners are
// permanently locked in by design (see JoinConfirmDialog on the client).
// Cascade-deletes the team's message board so we don't leave orphaned chat
// rows. Photos uploaded to the team are intentionally NOT touched: they
// remain the user's, only the team association becomes dangling.
export async function leaveTeamMission(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      fail(res, ErrCode.AUTH_FAILED, 'Authentication required');
      return;
    }
    const id = req.params.id;
    if (typeof id !== 'string' || !mongoose.isValidObjectId(id)) {
      fail(res, ErrCode.INVALID_PARAM, 'Invalid team mission id');
      return;
    }

    const team = await TeamMission.findById(id);
    if (!team) {
      fail(res, ErrCode.NOT_FOUND, 'Team mission not found');
      return;
    }
    if (String(team.createdBy) !== userId) {
      fail(
        res,
        ErrCode.AUTH_FAILED,
        'Only the team creator can disband the team',
      );
      return;
    }

    await TeamMessage.deleteMany({ teamMissionId: team._id });
    await team.deleteOne();
    ok(res, { destroyed: true, id });
  } catch (err) {
    console.error('Leave team mission failed:', err);
    res.status(500).json({ errno: 500, errmsg: 'Leave team mission failed' });
  }
}

// Members-only check shared by the message endpoints — returns the team or
// fails the response and returns null so the caller can short-circuit.
async function loadTeamForMember(
  req: Request,
  res: Response,
): Promise<{ team: InstanceType<typeof TeamMission>; userId: string } | null> {
  const userId = req.userId;
  if (!userId) {
    fail(res, ErrCode.AUTH_FAILED, 'Authentication required');
    return null;
  }
  const id = req.params.id;
  if (typeof id !== 'string' || !mongoose.isValidObjectId(id)) {
    fail(res, ErrCode.INVALID_PARAM, 'Invalid team mission id');
    return null;
  }
  const team = await TeamMission.findById(id);
  if (!team) {
    fail(res, ErrCode.NOT_FOUND, 'Team mission not found');
    return null;
  }
  if (!team.members.some((m) => String(m.userId) === userId)) {
    fail(res, ErrCode.AUTH_FAILED, 'Only team members can use the message board');
    return null;
  }
  return { team, userId };
}

// GET /api/team-missions/:id/messages  (auth, members only)
// Returns up to MESSAGE_PAGE_SIZE most recent messages, newest first.
export async function listTeamMessages(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const ctx = await loadTeamForMember(req, res);
    if (!ctx) return;
    const messages = await TeamMessage.find({ teamMissionId: ctx.team._id })
      .sort({ createdAt: -1 })
      .limit(MESSAGE_PAGE_SIZE);
    ok(res, messages);
  } catch (err) {
    console.error('List team messages failed:', err);
    res
      .status(500)
      .json({ errno: 500, errmsg: 'List team messages failed' });
  }
}

// POST /api/team-missions/:id/messages  (auth, members only)
// Body: { text }. Username/avatar are denormalized from the user record at
// write time so reads don't need a join.
export async function postTeamMessage(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const ctx = await loadTeamForMember(req, res);
    if (!ctx) return;

    const { text } = (req.body || {}) as { text?: string };
    const trimmed = text?.trim() ?? '';
    if (trimmed.length === 0) {
      fail(res, ErrCode.MISSING_PARAM, 'Message text is required');
      return;
    }
    if (trimmed.length > 500) {
      fail(res, ErrCode.INVALID_PARAM, 'Message must be 1–500 chars');
      return;
    }

    const user = await User.findById(ctx.userId);
    if (!user) {
      fail(res, ErrCode.NOT_FOUND, 'User not found');
      return;
    }

    const message = await TeamMessage.create({
      teamMissionId: ctx.team._id,
      userId: user._id,
      username: user.username,
      avatarUrl: user.avatarUrl,
      text: trimmed,
    });

    // Broadcast to every connected member of this team. The poster will also
    // receive their own event — client de-dupes by message id.
    emitToTeam(String(ctx.team._id), 'message:new', message.toJSON());

    ok(res, message);
  } catch (err) {
    console.error('Post team message failed:', err);
    res
      .status(500)
      .json({ errno: 500, errmsg: 'Post team message failed' });
  }
}
