
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { 
  getDashboardStats,
  getOwnerDashboardStats 
  , getFreeServiceUsage
} = require('../controllers/dashboardController');

router.route('/stats').get(protect, getDashboardStats);

router.route('/owner-stats').get(protect, getOwnerDashboardStats);

// Free services usage for sold vehicles
router.route('/free-services').get(protect, getFreeServiceUsage);

module.exports = router;