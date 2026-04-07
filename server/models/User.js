const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  googleId: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  avatarUrl: { type: String, default: '' },
  level: { type: Number, default: 1 },
  points: { type: Number, default: 0 },
  nextLevelPoints: { type: Number, default: 100 },
  photosUploaded: { type: Number, default: 0 },
  missionsCompleted: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
