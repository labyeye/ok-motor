
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { 
  getDashboardStats,
  getOwnerDashboardStats 
} = require('../controllers/dashboardController');

router.route('/stats').get(protect, getDashboardStats);

router.route('/owner-stats').get(protect, getOwnerDashboardStats);

module.exports = router;