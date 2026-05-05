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
import { localStorageDir, usingR2 } from './lib/storage';

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongodb:27017/chromawalk';

// CORS allowlist. CLIENT_ORIGIN is a comma-separated list where each entry
// is either:
//   • A full origin to match exactly:   https://chromawalker.pages.dev
//   • A wildcard hostname (https only): *.chromawalker.pages.dev
//     — matches the apex (chromawalker.pages.dev) AND any subdomain
//       (e.g. <branch>.chromawalker.pages.dev for Pages preview deploys).
// When unset (local dev) every origin is allowed so `vite` on any port
// can hit the API.
type OriginMatcher = (origin: string) => boolean;
function compileOriginMatchers(spec: string): OriginMatcher[] {
  return spec
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
    .map<OriginMatcher>((pattern) => {
      if (pattern.startsWith('*.')) {
        const baseHost = pattern.slice(2);
        return (origin) => {
          try {
            const url = new URL(origin);
            if (url.protocol !== 'https:') return false;
            return url.hostname === baseHost || url.hostname.endsWith('.' + baseHost);
          } catch {
            return false;
          }
        };
      }
      return (origin) => origin === pattern;
    });
}
const originMatchers = compileOriginMatchers(process.env.CLIENT_ORIGIN ?? '');
app.use(
  cors({
    origin:
      originMatchers.length === 0
        ? true
        : (origin, cb) => {
            // Requests without an Origin header (curl, server-to-server,
            // Fly health checks) aren't subject to CORS — let them through.
            if (!origin) return cb(null, true);
            if (originMatchers.some((m) => m(origin))) return cb(null, true);
            cb(new Error(`Origin ${origin} not allowed by CORS`));
          },
    credentials: true,
  }),
);
app.use(express.json({ limit: '10mb' }));

// In R2 mode, browsers fetch images directly from R2_PUBLIC_URL — no
// server-side static handler needed. In local mode, serve them from
// <server>/tmp at /tmp/<filename>.
if (!usingR2()) {
  app.use('/tmp', express.static(localStorageDir()));
}

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
