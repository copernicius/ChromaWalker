import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import mongoose from 'mongoose';

import authRoutes from './routes/auth';
import photoRoutes from './routes/photos';
import detectColorRoutes from './routes/detectColor';
import levelsRoutes from './routes/levels';
import missionsRoutes from './routes/missions';
import paletteRoutes from './routes/palette';

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongodb:27017/chromawalk';

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve uploaded images from the tmp directory (one level above src/dist).
app.use('/tmp', express.static(path.join(__dirname, '..', 'tmp')));

app.use('/api/auth', authRoutes);
app.use('/api/photos', photoRoutes);
app.use('/api/detect-color', detectColorRoutes);
app.use('/api/levels', levelsRoutes);
app.use('/api/missions', missionsRoutes);
app.use('/api/palette', paletteRoutes);

app.get('/', (_req, res) => {
  res.send('ChromaWalk API is running');
});

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err);
    process.exit(1);
  });
