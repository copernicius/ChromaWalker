const express = require('express');
const { googleLogin, getMe } = require('../controllers/authController');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.post('/google', googleLogin);
router.get('/me', auth, getMe);

module.exports = router;
