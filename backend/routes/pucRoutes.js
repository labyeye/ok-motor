const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  createPUC,
  getAllPUC,
  deletePUC,
} = require("../controllers/pucController");

router.route("/").post(protect, createPUC).get(protect, getAllPUC);

router.route("/:id").delete(protect, deletePUC);

module.exports = router;
