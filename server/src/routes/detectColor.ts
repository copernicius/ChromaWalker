import express from 'express';
import { detectColor } from '../controllers/colorController';

const router = express.Router();

router.post('/', detectColor);

export default router;
