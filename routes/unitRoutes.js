
const express = require("express");

const {
  registerUnit,
  getMyUnit,
  updateUnitAvailability,
  getMyAssignedEmergencies,
  updateEmergencyStatus,
} = require("../controller/unitController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/register",
  protect,
  authorize("unit"),
  registerUnit
);

router.get(
  "/me",
  protect,
  authorize("unit"),
  getMyUnit
);

router.patch(
  "/availability",
  protect,
  authorize("unit"),
  updateUnitAvailability
);

router.get(
  "/emergencies/assigned",
  protect,
  authorize("unit"),
  getMyAssignedEmergencies
);

router.patch(
  "/emergencies/:requestId/status",
  protect,
  authorize("unit"),
  updateEmergencyStatus
);

module.exports = router;
