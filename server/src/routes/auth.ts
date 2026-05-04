import express from 'express';
import multer from 'multer';
import {
  getMe,
  getMyUnlockedColors,
  googleLogin,
  updateMe,
} from '../controllers/authController';
import { auth } from '../middleware/auth';
import { r2Storage } from '../lib/storage';

const router = express.Router();

// Avatars stream to R2 under avatars/<uuid><ext>.
const upload = multer({
  storage: r2Storage('avatars/'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

router.post('/google', googleLogin);
router.get('/me', auth, getMe);
router.patch('/me', auth, upload.single('avatar'), updateMe);
router.get('/me/unlocked-colors', auth, getMyUnlockedColors);

export default router;
