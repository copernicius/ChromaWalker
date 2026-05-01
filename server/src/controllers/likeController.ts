import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { ErrCode, fail, ok } from '../lib/response';
import Like from '../models/Like';
import Photo from '../models/Photo';

// POST /api/photos/:id/like  (auth-gated; idempotent)
export async function likePhoto(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      fail(res, ErrCode.AUTH_FAILED, 'Authentication required');
      return;
    }

    const photoId = req.params.id;
    if (typeof photoId !== 'string' || !mongoose.isValidObjectId(photoId)) {
      fail(res, ErrCode.INVALID_PARAM, 'Invalid photo id');
      return;
    }

    const photo = await Photo.findById(photoId);
    if (!photo) {
      fail(res, ErrCode.NOT_FOUND, 'Photo not found');
      return;
    }

    try {
      await Like.create({
        userId: new mongoose.Types.ObjectId(userId),
        photoId: new mongoose.Types.ObjectId(photoId),
      });
      // Only bump the counter when the Like was actually new — otherwise a
      // double-click would inflate Photo.likes.
      await Photo.findByIdAndUpdate(photoId, { $inc: { likes: 1 } });
    } catch (err) {
      // 11000 = duplicate key → already liked, no-op.
      if ((err as { code?: number }).code !== 11000) throw err;
    }

    const fresh = await Photo.findById(photoId);
    ok(res, { id: photoId, likes: fresh?.likes ?? 0 });
  } catch (err) {
    console.error('Like failed:', err instanceof Error ? err.stack : err);
    res.status(500).json({ errno: 500, errmsg: 'Like failed' });
  }
}

// DELETE /api/photos/:id/like  (auth-gated; idempotent)
export async function unlikePhoto(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      fail(res, ErrCode.AUTH_FAILED, 'Authentication required');
      return;
    }

    const photoId = req.params.id;
    if (typeof photoId !== 'string' || !mongoose.isValidObjectId(photoId)) {
      fail(res, ErrCode.INVALID_PARAM, 'Invalid photo id');
      return;
    }

    const result = await Like.deleteOne({
      userId: new mongoose.Types.ObjectId(userId),
      photoId: new mongoose.Types.ObjectId(photoId),
    });
    // Only decrement when a Like was actually deleted — that invariant means
    // the counter was at least 1, so plain $inc can't push it negative.
    if (result.deletedCount > 0) {
      await Photo.findByIdAndUpdate(photoId, { $inc: { likes: -1 } });
    }

    const fresh = await Photo.findById(photoId);
    ok(res, { id: photoId, likes: fresh?.likes ?? 0 });
  } catch (err) {
    console.error('Unlike failed:', err instanceof Error ? err.stack : err);
    res.status(500).json({ errno: 500, errmsg: 'Unlike failed' });
  }
}

// GET /api/photos/me/likes  (auth-gated)
// Returns just the photoIds — the photos themselves come from /api/photos.
export async function getMyLikes(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      fail(res, ErrCode.AUTH_FAILED, 'Authentication required');
      return;
    }

    const likes = await Like.find({
      userId: new mongoose.Types.ObjectId(userId),
    })
      .select('photoId')
      .lean();
    ok(res, likes.map((l) => String(l.photoId)));
  } catch (err) {
    console.error('Failed to fetch likes:', err);
    res.status(500).json({ errno: 500, errmsg: 'Failed to fetch likes' });
  }
}
