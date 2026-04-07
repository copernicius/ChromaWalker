require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth');
const photoRoutes = require('./routes/photos');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongodb:27017/chromawalk';

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded images from the tmp directory
app.use('/tmp', express.static(path.join(__dirname, 'tmp')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/photos', photoRoutes);

app.get('/', (_req, res) => {
  res.send('ChromaWalk API is running');
});

// Connect to MongoDB then start listening
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection failed:', err);
    process.exit(1);
  });
