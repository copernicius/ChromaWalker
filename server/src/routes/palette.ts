import express from 'express';
import { getPalette } from '../controllers/paletteController';

const router = express.Router();

router.get('/', getPalette);

export default router;
