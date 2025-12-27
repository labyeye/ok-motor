const express = require("express");
const router = express.Router();
const {
  getBikeDetails,
  getBikeMakes,
  getBikeModels
} = require("../controllers/bikeController");

router.get("/", getBikeDetails);

router.get("/makes", getBikeMakes);

router.get("/models", getBikeModels);

module.exports = router;
