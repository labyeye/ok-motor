const express = require("express");
const router = express.Router();
const vehicleController = require("../controllers/vehicleController");
const { protect } = require("../middleware/auth");

router.get("/public/listings", vehicleController.getPublicVehicleListings);

router.get("/public/filters", vehicleController.getPublicFilters);

router.use(protect);

router.get("/imagekit-auth", vehicleController.getImageKitAuth);

router.post("/", vehicleController.createVehicle);
router.get("/", vehicleController.getVehicles);
router.get("/:id", vehicleController.getVehicleById);
router.get(
  "/registration/:registrationNumber",
  vehicleController.getVehicleByRegistration,
);
router.put("/:id", vehicleController.updateVehicle);
router.delete("/:id", vehicleController.deleteVehicle);

router.delete("/:id/images/:fileId", vehicleController.deleteVehicleImage);

router.delete("/:id/permanent", vehicleController.permanentDeleteVehicle);

module.exports = router;
