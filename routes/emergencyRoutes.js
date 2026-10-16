
const express = require("express");

const {
  createEmergencyRequest,
  getMyEmergencyRequests,
  getEmergencyRequestById,
  cancelEmergencyRequest,
} = require("../controller/emergencyController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

// Only normal users can create emergency requests
router.post(
  "/",
  protect,
  authorize("user"),
  createEmergencyRequest
);

// Get the logged-in user's requests
router.get(
  "/my",
  protect,
  authorize("user"),
  getMyEmergencyRequests
);

// Get one of the logged-in user's requests
router.get(
  "/:requestId",
  protect,
  authorize("user"),
  getEmergencyRequestById
);

// Cancel a pending request
router.patch(
  "/:requestId/cancel",
  protect,
  authorize("user"),
  cancelEmergencyRequest
);

module.exports = router;
