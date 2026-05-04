import express from 'express';
import multer from 'multer';
import { bookmarkPhoto, getMyBookmarks, unbookmarkPhoto } from '../controllers/bookmarkController';
import { createComment, getComments } from '../controllers/commentController';
import { getMyLikes, likePhoto, unlikePhoto } from '../controllers/likeController';
import {
  deletePhoto,
  getNearbyPhotos,
  getPhotoById,
  getPhotos,
  uploadPhoto,
} from '../controllers/photoController';
import { auth } from '../middleware/auth';
import { r2Storage } from '../lib/storage';

const router = express.Router();

// Photos stream straight to R2 under photos/<uuid><ext>. The handler reads
// the resulting public URL from req.file (multer-s3 attaches `key` and
// `location` fields).
const upload = multer({
  storage: r2Storage('photos/'),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

router.post('/upload', auth, upload.single('image'), uploadPhoto);
// /me/* must be registered before the dynamic /:id routes, otherwise
// Express matches them as id="me".
router.get('/me/likes', auth, getMyLikes);
router.get('/me/bookmarks', auth, getMyBookmarks);
router.get('/nearby', getNearbyPhotos);
router.get('/', getPhotos);
router.get('/:id', getPhotoById);
router.delete('/:id', auth, deletePhoto);
router.post('/:id/like', auth, likePhoto);
router.delete('/:id/like', auth, unlikePhoto);
router.post('/:id/bookmark', auth, bookmarkPhoto);
router.delete('/:id/bookmark', auth, unbookmarkPhoto);
router.get('/:photoId/comments', getComments);
router.post('/:photoId/comments', auth, createComment);

export default router;
