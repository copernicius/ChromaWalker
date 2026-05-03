import { randomUUID } from 'crypto';
import path from 'path';
import express from 'express';
import multer from 'multer';
import {
  getMe,
  getMyUnlockedColors,
  googleLogin,
  updateMe,
} from '../controllers/authController';
import { auth } from '../middleware/auth';

const router = express.Router();

const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', '..', 'tmp'),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
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
