const path = require('path');
const Photo = require('../models/Photo');

/**
 * Mock color analysis — returns a random dominant RGB and a small palette.
 * Replace this with a real image-processing library (e.g. sharp + quantize)
 * when you're ready.
 */
function mockAnalyseImage(_filePath) {
  const rand = () => Math.floor(Math.random() * 256);
  const dominantRGB = { r: rand(), g: rand(), b: rand() };
  const palette = Array.from({ length: 5 }, () => ({
    r: rand(),
    g: rand(),
    b: rand(),
  }));
  return { dominantRGB, palette };
}

// POST /api/photos/upload
async function uploadPhoto(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const { color, location, lat, lng, username } = req.body;

    if (!color || !location || !username) {
      return res.status(400).json({ error: 'color, location and username are required' });
    }

    // Run mock analysis on the uploaded file
    const analysis = mockAnalyseImage(req.file.path);

    const photo = await Photo.create({
      imageUrl: `/tmp/${req.file.filename}`,
      color,
      location,
      lat: lat ? Number(lat) : 0,
      lng: lng ? Number(lng) : 0,
      username,
      analysis,
    });

    res.status(201).json(photo);
  } catch (err) {
    console.error('Upload failed:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
}

// GET /api/photos
async function getPhotos(req, res) {
  try {
    const { color, username } = req.query;
    const filter = {};
    if (color) filter.color = color;
    if (username) filter.username = username;

    const photos = await Photo.find(filter).sort({ createdAt: -1 });
    res.json(photos);
  } catch (err) {
    console.error('Failed to fetch photos:', err);
    res.status(500).json({ error: 'Failed to fetch photos' });
  }
}

// GET /api/photos/:id
async function getPhotoById(req, res) {
  try {
    const photo = await Photo.findById(req.params.id);
    if (!photo) return res.status(404).json({ error: 'Photo not found' });
    res.json(photo);
  } catch (err) {
    console.error('Failed to fetch photo:', err);
    res.status(500).json({ error: 'Failed to fetch photo' });
  }
}

module.exports = { uploadPhoto, getPhotos, getPhotoById };
