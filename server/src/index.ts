import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import mongoose from 'mongoose';

import achievementsRoutes from './routes/achievements';
import authRoutes from './routes/auth';
import photoRoutes from './routes/photos';
import detectColorRoutes from './routes/detectColor';
import levelsRoutes from './routes/levels';
import missionsRoutes from './routes/missions';
import paletteRoutes from './routes/palette';
import teamMissionsRoutes from './routes/teamMissions';
import { initRealtime } from './lib/realtime';

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongodb:27017/chromawalk';

// Allow the known frontend origin(s). Set CLIENT_ORIGIN via Fly secret to
// the deployed Cloudflare Pages URL (comma-separate to allow more than one,
// e.g. preview deploys). When unset (local dev), allow any origin so
// `vite` on whichever port can hit the API.
const allowedOrigins = (process.env.CLIENT_ORIGIN ?? '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);
app.use(
  cors({
    origin: allowedOrigins.length === 0 ? true : allowedOrigins,
    credentials: true,
  }),
);
app.use(express.json({ limit: '10mb' }));

// Uploaded images live in Cloudflare R2 — see lib/storage.ts. Browsers
// fetch them directly from R2_PUBLIC_URL, no proxy needed.

app.use('/api/auth', authRoutes);
app.use('/api/photos', photoRoutes);
app.use('/api/detect-color', detectColorRoutes);
app.use('/api/achievements', achievementsRoutes);
app.use('/api/levels', levelsRoutes);
app.use('/api/missions', missionsRoutes);
app.use('/api/palette', paletteRoutes);
app.use('/api/team-missions', teamMissionsRoutes);

app.get('/', (_req, res) => {
  res.send('ChromaWalk API is running');
});

// Wrap Express in a bare http.Server so Socket.IO can share the same port
// and listen socket. Realtime is opt-in per feature via emitToTeam /
// emitToUser inside the controllers.
const httpServer = http.createServer(app);
initRealtime(httpServer);

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    httpServer.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err);
    process.exit(1);
  });
