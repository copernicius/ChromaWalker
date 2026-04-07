const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { uploadPhoto, getPhotos, getPhotoById } = require('../controllers/photoController');

const router = express.Router();

// Store uploads in the tmp directory with a unique filename
const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', 'tmp'),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

router.post('/upload', upload.single('image'), uploadPhoto);
router.get('/', getPhotos);
router.get('/:id', getPhotoById);

module.exports = router;
