import express from 'express';
import { getMyAchievements } from '../controllers/achievementsController';
import { auth } from '../middleware/auth';

const router = express.Router();

router.get('/me', auth, getMyAchievements);

export default router;
