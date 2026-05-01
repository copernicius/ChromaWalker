import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { ErrCode, fail, ok } from '../lib/response';
import Comment from '../models/Comment';
import Photo from '../models/Photo';
import User from '../models/User';

// GET /api/photos/:photoId/comments  (public)
// Returns all comments for the photo in DFS order (sorted by materialized
// path). Client renders by iterating + indenting by depth.
export async function getComments(req: Request, res: Response): Promise<void> {
  try {
    const photoId = req.params.photoId;
    if (typeof photoId !== 'string' || !mongoose.isValidObjectId(photoId)) {
      fail(res, ErrCode.INVALID_PARAM, 'Invalid photo id');
      return;
    }

    const comments = await Comment.find({
      photoId: new mongoose.Types.ObjectId(photoId),
    }).sort({ path: 1, createdAt: 1 });

    ok(res, comments);
  } catch (err) {
    console.error('Failed to fetch comments:', err);
    res.status(500).json({ errno: 500, errmsg: 'Failed to fetch comments' });
  }
}

// POST /api/photos/:photoId/comments  (auth-gated)
// Body: { text: string, parentId?: string }
export async function createComment(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      fail(res, ErrCode.AUTH_FAILED, 'Authentication required');
      return;
    }

    const photoId = req.params.photoId;
    if (typeof photoId !== 'string' || !mongoose.isValidObjectId(photoId)) {
      fail(res, ErrCode.INVALID_PARAM, 'Invalid photo id');
      return;
    }

    const { text, parentId } = (req.body || {}) as {
      text?: string;
      parentId?: string;
    };

    const trimmed = text?.trim() ?? '';
    if (trimmed.length === 0 || trimmed.length > 1000) {
      fail(res, ErrCode.INVALID_PARAM, 'Comment text must be 1–1000 characters');
      return;
    }

    const photo = await Photo.findById(photoId);
    if (!photo) {
      fail(res, ErrCode.NOT_FOUND, 'Photo not found');
      return;
    }

    // Resolve parent (if any) and compute the new comment's path/depth from
    // it. Generating _id up front lets us bake it into the path before save.
    let parent = null;
    if (parentId) {
      if (!mongoose.isValidObjectId(parentId)) {
        fail(res, ErrCode.INVALID_PARAM, 'Invalid parent comment id');
        return;
      }
      parent = await Comment.findById(parentId);
      if (!parent || String(parent.photoId) !== photoId) {
        fail(res, ErrCode.NOT_FOUND, 'Parent comment not found');
        return;
      }
    }

    const user = await User.findById(userId);
    if (!user) {
      fail(res, ErrCode.NOT_FOUND, 'User not found');
      return;
    }

    const newId = new mongoose.Types.ObjectId();
    const path = parent ? `${parent.path}/${newId.toHexString()}` : newId.toHexString();
    const depth = parent ? parent.depth + 1 : 0;

    const comment = await Comment.create({
      _id: newId,
      photoId: photo._id,
      userId: user._id,
      username: user.username,
      avatarUrl: user.avatarUrl,
      parentId: parent ? parent._id : null,
      path,
      depth,
      text: trimmed,
    });

    await Photo.findByIdAndUpdate(photo._id, { $inc: { comments: 1 } });

    ok(res, comment);
  } catch (err) {
    console.error('Create comment failed:', err);
    res.status(500).json({ errno: 500, errmsg: 'Create comment failed' });
  }
}
