const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

const {
  getGalleryImages,
  getAllGalleryImages,
  getImageKitAuth,
  uploadGalleryImage,
  uploadGalleryFiles,
  updateGalleryImage,
  deleteGalleryImage,
  updateGalleryOrder,
} = require('../controllers/galleryController');

// Public routes
router.get('/', getGalleryImages);

// Protected routes (Admin only)
router.use(protect);
router.use(admin);

router.get('/all', getAllGalleryImages);
router.get('/auth', getImageKitAuth);
// Upload small files to server which will forward them to ImageKit securely
router.post('/upload', upload.array('files'), uploadGalleryFiles);
router.post('/', uploadGalleryImage);
router.put('/order', updateGalleryOrder);
router.put('/:id', updateGalleryImage);
router.delete('/:id', deleteGalleryImage);

module.exports = router;
