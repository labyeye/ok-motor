const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect, admin } = require('../middleware/auth');
const {
  createUpdate,
  getActiveUpdates,
  getAllUpdatesAdmin,
  getUpdate,
  updateUpdate,
  deleteUpdate,
} = require('../controllers/updatesController');

// multer memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Public: get active updates (used by website)
router.get('/', getActiveUpdates);

// Admin: get all updates
router.get('/admin', protect, admin, getAllUpdatesAdmin);

// Public: get single update (if active) or admin access
router.get('/:id', getUpdate);

// Admin: create update (with images)
router.post('/', protect, admin, upload.array('images', 10), createUpdate);

// Admin: update (append images)
router.put('/:id', protect, admin, upload.array('images', 10), updateUpdate);

// Admin: soft delete
router.delete('/:id', protect, admin, deleteUpdate);

module.exports = router;
