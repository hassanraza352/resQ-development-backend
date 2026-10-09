const express = require("express");

const {
protect,
authorize,
} = require("../middleware/authMiddleware");

const {
assignUnitRole,
getPendingUnits,
reviewUnit,
assignHospitalRole,
getPendingHospitals,
reviewHospital,
} = require("../controller/adminController");

const router = express.Router();

// All routes below require an authenticated admin
router.use(protect, authorize("admin"));

// Admin dashboard
router.get("/dashboard", (req, res) => {
return res.status(200).json({
success: true,
message: "Welcome to the ResQ Admin Dashboard",
admin: req.user,
});
});

// Assign unit role to an existing user
router.patch("/users/:userId/assign-unit", assignUnitRole);

// Get pending unit registrations
router.get("/units/pending", getPendingUnits);

// Verify or reject a unit
router.patch("/units/:unitId/review", reviewUnit);

router.patch(
  "/users/:userId/assign-hospital",
  assignHospitalRole
);

// Get hospitals waiting for approval
router.get(
  "/hospitals/pending",
  getPendingHospitals
);

// Verify or reject a hospital
router.patch(
  "/hospitals/:hospitalId/review",
  reviewHospital
);

module.exports = router;
