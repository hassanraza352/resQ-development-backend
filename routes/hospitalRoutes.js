
const express = require("express");

const {
  registerHospital,
  getMyHospital,
} = require("../controller/hospitalController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/register",
  protect,
  authorize("hospital"),
  registerHospital
);

router.get(
  "/me",
  protect,
  authorize("hospital"),
  getMyHospital
);

module.exports = router;