const Unit = require("../model/Unit");

// Register a new unit
const registerUnit = async (req, res) => {
try {
const {
registrationNumber,
vehicleModel,
vehicleType,
contactNumber,
capacity,
} = req.body;

if (
  !registrationNumber ||
  !vehicleModel ||
  !vehicleType ||
  !contactNumber ||
  capacity === undefined
) {
  return res.status(400).json({
    success: false,
    message: "Please provide all required unit details",
  });
}

if (!Number.isInteger(Number(capacity)) || Number(capacity) < 1) {
  return res.status(400).json({
    success: false,
    message: "Capacity must be a positive whole number",
  });
}

const existingUnit = await Unit.findOne({
  registrationNumber: registrationNumber.trim().toUpperCase(),
});

if (existingUnit) {
  return res.status(409).json({
    success: false,
    message: "This vehicle is already registered",
  });
}

const unit = await Unit.create({
  user: req.user.id,
  registrationNumber,
  vehicleModel,
  vehicleType,
  contactNumber,
  capacity: Number(capacity),
  availability: "offline",
  verificationStatus: "pending",
});

return res.status(201).json({
  success: true,
  message: "Unit registered and awaiting admin verification",
  unit,
});

} catch (error) {
console.error("Unit registration error:", error.message);

if (error.code === 11000) {
  return res.status(409).json({
    success: false,
    message: "This vehicle or account is already registered",
  });
}

if (error.name === "ValidationError") {
  return res.status(400).json({
    success: false,
    message: error.message,
  });
}

return res.status(500).json({
  success: false,
  message: "Internal server error",
});

}
};

// Get the logged-in unit's details
const getMyUnit = async (req, res) => {
try {
const unit = await Unit.findOne({ user: req.user.id });

if (!unit) {
  return res.status(404).json({
    success: false,
    message: "No unit is registered for this account",
  });
}

return res.status(200).json({
  success: true,
  unit,
});

} catch (error) {
console.error("Get unit error:", error.message);

return res.status(500).json({
  success: false,
  message: "Internal server error",
});

}
};

module.exports = {
registerUnit,
getMyUnit,
};
