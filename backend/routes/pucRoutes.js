const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  createPUC,
  getAllPUC,
  deletePUC,
  updatePUC,
  getPUCByVehicle,
  upsertPUCByVehicle,
} = require("../controllers/pucController");

router.route("/").post(protect, createPUC).get(protect, getAllPUC);

// Lookup by registration and upsert
router
  .route("/vehicle/:vehicleRegNo")
  .get(protect, getPUCByVehicle)
  .put(protect, upsertPUCByVehicle);

router.route("/:id").delete(protect, deletePUC).put(protect, updatePUC);

module.exports = router;
