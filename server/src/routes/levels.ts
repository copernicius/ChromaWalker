import express from 'express';
import { getLevels } from '../controllers/levelsController';

const router = express.Router();

router.get('/', getLevels);

export default router;
