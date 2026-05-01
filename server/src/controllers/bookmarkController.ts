import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { ErrCode, fail, ok } from '../lib/response';
import Bookmark from '../models/Bookmark';
import Photo from '../models/Photo';

// POST /api/photos/:id/bookmark  (auth-gated; idempotent)
export async function bookmarkPhoto(req: Request, res: Response): Promise<void> {
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
      await Bookmark.create({
        userId: new mongoose.Types.ObjectId(userId),
        photoId: new mongoose.Types.ObjectId(photoId),
      });
      // Only bump the counter when the Bookmark was actually new.
      await Photo.findByIdAndUpdate(photoId, { $inc: { favorites: 1 } });
    } catch (err) {
      // 11000 = duplicate key → already saved, no-op.
      if ((err as { code?: number }).code !== 11000) throw err;
    }

    const fresh = await Photo.findById(photoId);
    ok(res, { id: photoId, favorites: fresh?.favorites ?? 0 });
  } catch (err) {
    console.error('Bookmark failed:', err);
    res.status(500).json({ errno: 500, errmsg: 'Bookmark failed' });
  }
}

// DELETE /api/photos/:id/bookmark  (auth-gated; idempotent)
export async function unbookmarkPhoto(req: Request, res: Response): Promise<void> {
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

    const result = await Bookmark.deleteOne({
      userId: new mongoose.Types.ObjectId(userId),
      photoId: new mongoose.Types.ObjectId(photoId),
    });
    if (result.deletedCount > 0) {
      await Photo.findByIdAndUpdate(photoId, { $inc: { favorites: -1 } });
    }

    const fresh = await Photo.findById(photoId);
    ok(res, { id: photoId, favorites: fresh?.favorites ?? 0 });
  } catch (err) {
    console.error('Unbookmark failed:', err);
    res.status(500).json({ errno: 500, errmsg: 'Unbookmark failed' });
  }
}

// GET /api/photos/me/bookmarks  (auth-gated)
// Returns just the photoIds — the photos themselves come from /api/photos.
export async function getMyBookmarks(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      fail(res, ErrCode.AUTH_FAILED, 'Authentication required');
      return;
    }

    const bookmarks = await Bookmark.find({
      userId: new mongoose.Types.ObjectId(userId),
    })
      .select('photoId')
      .lean();
    ok(res, bookmarks.map((b) => String(b.photoId)));
  } catch (err) {
    console.error('Failed to fetch bookmarks:', err);
    res.status(500).json({ errno: 500, errmsg: 'Failed to fetch bookmarks' });
  }
}
