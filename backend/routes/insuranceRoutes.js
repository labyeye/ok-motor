const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  createInsurance,
  getAllInsurance,
  deleteInsurance,
} = require("../controllers/insuranceController");

router.route("/").post(protect, createInsurance).get(protect, getAllInsurance);

router.route("/:id").delete(protect, deleteInsurance);

module.exports = router;
