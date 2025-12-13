// routes/vehicleRoutes.js
const express = require("express");
const router = express.Router();
const vehicleController = require("../controllers/vehicleController");
const { protect } = require("../middleware/auth");

// Public routes
router.get("/public/listings", vehicleController.getPublicVehicleListings);
// Public filter data (brands, years, price ranges, types)
router.get("/public/filters", vehicleController.getPublicFilters);

// Protected routes - require authentication
router.use(protect);

// ImageKit authentication
router.get("/imagekit-auth", vehicleController.getImageKitAuth);

// CRUD operations
router.post("/", vehicleController.createVehicle);
router.get("/", vehicleController.getVehicles);
router.get("/:id", vehicleController.getVehicleById);
router.get(
  "/registration/:registrationNumber",
  vehicleController.getVehicleByRegistration
);
router.put("/:id", vehicleController.updateVehicle);
router.delete("/:id", vehicleController.deleteVehicle);

// Image management
router.delete("/:id/images/:fileId", vehicleController.deleteVehicleImage);

// Admin only - permanent delete
router.delete("/:id/permanent", vehicleController.permanentDeleteVehicle);

module.exports = router;
