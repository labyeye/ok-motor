const express = require("express");
const router = express.Router();
const {
  getBikeDetails,
  getBikeMakes,
  getBikeModels
} = require("../controllers/bikeController");

// @route   GET /api/bikes
// @desc    Get bike details by make, model, and year
// @access  Public
router.get("/", getBikeDetails);

// @route   GET /api/bikes/makes
// @desc    Get all available bike makes
// @access  Public
router.get("/makes", getBikeMakes);

// @route   GET /api/bikes/models
// @desc    Get models for a specific make
// @access  Public
router.get("/models", getBikeModels);

module.exports = router;
