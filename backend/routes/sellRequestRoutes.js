const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/auth');
const roleAuth = require('../middleware/role');
const {
  createSellRequest,
  getAllSellRequests,
  getSellRequest,
  updateSellRequestStatus,
} = require('../controllers/sellRequestController');

// Use memory storage so we can pass buffer to ImageKit
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Public endpoint for users to submit sell form
router.post('/', upload.array('images', 5), createSellRequest);

// Admin endpoints
router.get('/', protect, roleAuth(['admin']), getAllSellRequests);
router.get('/:id', protect, roleAuth(['admin']), getSellRequest);
router.patch('/:id/status', protect, roleAuth(['admin']), updateSellRequestStatus);

module.exports = router;
