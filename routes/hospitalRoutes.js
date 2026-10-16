
const express = require("express");

const {
  registerHospital,
  getMyHospital,
  updateHospitalAvailability,
  getHospitalEmergencyRequests,
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
router.patch(
  "/availability",
  protect,
  authorize("hospital"),
  updateHospitalAvailability
);

router.get(
  "/emergencies/incoming",
  protect,
  authorize("hospital"),
  getHospitalEmergencyRequests
);

module.exports = router;