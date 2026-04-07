const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const { signToken } = require('../middleware/auth');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

// POST /api/auth/google
async function googleLogin(req, res) {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ error: 'Missing credential' });
    }

    // Verify the Google ID token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // Find existing user or create a new one
    let user = await User.findOne({ googleId });
    if (!user) {
      user = await User.create({
        googleId,
        email,
        username: name,
        avatarUrl: picture || '',
      });
    }

    const token = signToken(user._id);

    res.json({
      user: {
        _id: user._id,
        googleId: user.googleId,
        email: user.email,
        username: user.username,
        avatarUrl: user.avatarUrl,
        level: user.level,
        points: user.points,
        nextLevelPoints: user.nextLevelPoints,
        photosUploaded: user.photosUploaded,
        missionsCompleted: user.missionsCompleted,
      },
      token,
    });
  } catch (err) {
    console.error('Google login failed:', err);
    res.status(401).json({ error: 'Invalid Google token' });
  }
}

// GET /api/auth/me
async function getMe(req, res) {
  try {
    const user = await User.findById(req.userId).select('-__v');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('Failed to get user:', err);
    res.status(500).json({ error: 'Failed to get user' });
  }
}

module.exports = { googleLogin, getMe };
