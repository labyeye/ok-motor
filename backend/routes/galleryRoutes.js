const express = require("express");
const router = express.Router();
const { protect, admin } = require("../middleware/auth");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

const {
  getGalleryImages,
  getAllGalleryImages,
  getImageKitAuth,
  uploadGalleryImage,
  uploadGalleryFiles,
  updateGalleryImage,
  deleteGalleryImage,
  updateGalleryOrder,
} = require("../controllers/galleryController");

router.get("/", getGalleryImages);

router.use(protect);
router.use(admin);

router.get("/all", getAllGalleryImages);
router.get("/auth", getImageKitAuth);

router.post("/upload", upload.array("files"), uploadGalleryFiles);
router.post("/", uploadGalleryImage);
router.put("/order", updateGalleryOrder);
router.put("/:id", updateGalleryImage);
router.delete("/:id", deleteGalleryImage);

module.exports = router;
