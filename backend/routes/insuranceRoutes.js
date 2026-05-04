const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  createInsurance,
  getAllInsurance,
  deleteInsurance,
  updateInsurance,
  getInsuranceByVehicle,
  upsertInsuranceByVehicle,
} = require("../controllers/insuranceController");

router.route("/").post(protect, createInsurance).get(protect, getAllInsurance);

router
  .route("/:id")
  .delete(protect, deleteInsurance)
  .put(protect, updateInsurance);

router
  .route("/vehicle/:vehicleRegNo")
  .get(protect, getInsuranceByVehicle)
  .put(protect, upsertInsuranceByVehicle);

module.exports = router;
