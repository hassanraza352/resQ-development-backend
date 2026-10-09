const User = require("../model/User");
const Unit = require("../model/Unit");
const Hospital = require("../model/Hospital");

// Assign unit role to an existing user
const assignUnitRole = async (req, res) => {
try {
const { userId } = req.params;


const user = await User.findById(userId);

if (!user) {
  return res.status(404).json({
    success: false,
    message: "User not found",
  });
}

if (user.role === "unit") {
  return res.status(409).json({
    success: false,
    message: "This account already has the unit role",
  });
}

if (user.role !== "user") {
  return res.status(400).json({
    success: false,
    message: "Only regular user accounts can be assigned the unit role",
  });
}

user.role = "unit";
await user.save();

return res.status(200).json({
  success: true,
  message: "Unit role assigned successfully",
  user: {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  },
});


} catch (error) {
console.error("Assign unit role error:", error.message);


if (error.name === "CastError") {
  return res.status(400).json({
    success: false,
    message: "Invalid user ID",
  });
}

return res.status(500).json({
  success: false,
  message: "Internal server error",
});


}
};

// Get all pending unit registrations
const getPendingUnits = async (req, res) => {
try {
const units = await Unit.find({
verificationStatus: "pending",
})
.populate("user", "name email phone")
.sort({ createdAt: -1 });


return res.status(200).json({
  success: true,
  count: units.length,
  units,
});


} catch (error) {
console.error("Get pending units error:", error.message);


return res.status(500).json({
  success: false,
  message: "Internal server error",
});


}
};

// Approve or reject a unit registration
const reviewUnit = async (req, res) => {
try {
const { unitId } = req.params;
const { status } = req.body;


if (!["verified", "rejected"].includes(status)) {
  return res.status(400).json({
    success: false,
    message: "Status must be verified or rejected",
  });
}

const unit = await Unit.findById(unitId);

if (!unit) {
  return res.status(404).json({
    success: false,
    message: "Unit not found",
  });
}

if (unit.verificationStatus !== "pending") {
  return res.status(409).json({
    success: false,
    message: "This unit has already been reviewed",
  });
}

unit.verificationStatus = status;

// A newly reviewed unit stays offline until it is activated.
unit.availability = "offline";

await unit.save();

return res.status(200).json({
  success: true,
  message:
    status === "verified"
      ? "Unit verified successfully"
      : "Unit registration rejected",
  unit,
});


} catch (error) {
console.error("Review unit error:", error.message);


if (error.name === "CastError") {
  return res.status(400).json({
    success: false,
    message: "Invalid unit ID",
  });
}

return res.status(500).json({
  success: false,
  message: "Internal server error",
});


}
};


const assignHospitalRole = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.role === "hospital") {
      return res.status(409).json({
        success: false,
        message: "This user already has the hospital role",
      });
    }

    if (user.role !== "user") {
      return res.status(400).json({
        success: false,
        message: "Only regular users can be assigned the hospital role",
      });
    }

    user.role = "hospital";
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Hospital role assigned successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    console.error("Assign hospital role error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to assign hospital role",
    });
  }
};

const getPendingHospitals = async (req, res) => {
  try {
    const hospitals = await Hospital.find({
      verificationStatus: "pending",
    })
      .populate("user", "name email phone")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: hospitals.length,
      hospitals,
    });
  } catch (error) {
    console.error("Get pending hospitals error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve pending hospitals",
    });
  }
};

const reviewHospital = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["verified", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be verified or rejected",
      });
    }

    const hospital = await Hospital.findById(req.params.hospitalId);

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: "Hospital not found",
      });
    }

    if (hospital.verificationStatus !== "pending") {
      return res.status(400).json({
        success: false,
        message: "This hospital has already been reviewed",
      });
    }

    hospital.verificationStatus = status;

    // Hospital must be manually enabled after verification.
    hospital.emergencyAvailability = "not-accepting";

    await hospital.save();

    return res.status(200).json({
      success: true,
      message: `Hospital ${status} successfully`,
      hospital,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid hospital ID",
      });
    }

    console.error("Review hospital error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to review hospital",
    });
  }
};

module.exports = {
assignUnitRole,
getPendingUnits,
reviewUnit,
assignHospitalRole,
getPendingHospitals,
reviewHospital,
};
