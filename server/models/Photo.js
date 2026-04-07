const mongoose = require('mongoose');

const photoSchema = new mongoose.Schema({
  imageUrl: { type: String, required: true },
  color: { type: String, required: true },
  location: { type: String, required: true },
  lat: { type: Number, default: 0 },
  lng: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  favorites: { type: Number, default: 0 },
  comments: { type: Number, default: 0 },
  username: { type: String, required: true },
  analysis: {
    dominantRGB: { r: Number, g: Number, b: Number },
    palette: [{ r: Number, g: Number, b: Number }],
  },
}, { timestamps: true });

module.exports = mongoose.model('Photo', photoSchema);
