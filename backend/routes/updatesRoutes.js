const express = require("express");
const router = express.Router();
const { protect, admin } = require("../middleware/auth");
const {
  createUpdate,
  getActiveUpdates,
  getAllUpdatesAdmin,
  getUpdate,
  updateUpdate,
  deleteUpdate,
} = require("../controllers/updatesController");

const upload = require("../middleware/upload");

router.get("/", getActiveUpdates);

router.get("/admin", protect, admin, getAllUpdatesAdmin);

router.get("/:id", getUpdate);

router.post("/", protect, admin, upload.array("images", 10), createUpdate);

router.put("/:id", protect, admin, upload.array("images", 10), updateUpdate);

router.delete("/:id", protect, admin, deleteUpdate);

module.exports = router;
