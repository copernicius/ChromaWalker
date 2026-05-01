import express from 'express';
import { getMissions } from '../controllers/missionsController';

const router = express.Router();

router.get('/', getMissions);

export default router;
