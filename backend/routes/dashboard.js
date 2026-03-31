
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { 
  getDashboardStats,
  getOwnerDashboardStats,
  getFreeServiceUsage,
  getIncompleteLetters,
  getPucExpiryReminders,
  getInsuranceExpiryReminders
} = require('../controllers/dashboardController');

router.route('/stats').get(protect, getDashboardStats);
router.route('/owner-stats').get(protect, getOwnerDashboardStats);
router.route('/free-services').get(protect, getFreeServiceUsage);
router.route('/incomplete-letters').get(protect, getIncompleteLetters);
router.route('/puc-expiry').get(protect, getPucExpiryReminders);
router.route('/insurance-expiry').get(protect, getInsuranceExpiryReminders);

module.exports = router;
