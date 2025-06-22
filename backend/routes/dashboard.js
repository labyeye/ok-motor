const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { 
  getDashboardStats,
  getOwnerDashboardStats 
} = require('../controllers/dashboardController');

// Regular admin dashboard
router.route('/stats').get(protect, getDashboardStats);

// Owner-specific dashboard
router.route('/owner-stats').get(protect, getOwnerDashboardStats);

module.exports = router;