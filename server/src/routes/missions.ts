import express from 'express';
import {
  getDailyMission,
  getMyMissionProgress,
  getSoloMissions,
} from '../controllers/missionsController';
import { auth } from '../middleware/auth';

const router = express.Router();

// /me/progress before any catch-all dynamic routes (none here today, but
// keeping the convention for future).
router.get('/me/progress', auth, getMyMissionProgress);
router.get('/daily', getDailyMission);
router.get('/solo', getSoloMissions);

export default router;
