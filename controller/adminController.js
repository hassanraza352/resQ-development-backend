const User = require("../model/User");
const Unit = require("../model/Unit");
const Hospital = require("../model/Hospital");
const EmergencyRequest = require("../model/EmergencyRequest");

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




const getPendingEmergencies = async (req, res) => {
  try {
    const requests = await EmergencyRequest.find({
      status: "pending",
    })
      .populate("requester", "name email phone")
      .sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      count: requests.length,
      requests,
    });
  } catch (error) {
    console.error("Get pending emergencies error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve pending emergencies",
    });
  }
};

const assignUnitToEmergency = async (req, res) => {
  let reservedUnitId = null;

  try {
    const { unitId } = req.body;
    const { requestId } = req.params;

    if (!unitId) {
      return res.status(400).json({
        success: false,
        message: "Unit ID is required",
      });
    }

    const emergencyRequest = await EmergencyRequest.findOne({
      _id: requestId,
      status: "pending",
    });

    if (!emergencyRequest) {
      return res.status(404).json({
        success: false,
        message: "Pending emergency request not found",
      });
    }

    // Atomically reserve only a verified, available unit.
    const unit = await Unit.findOneAndUpdate(
      {
        _id: unitId,
        verificationStatus: "verified",
        availability: "available",
      },
      {
        $set: { availability: "busy" },
      },
      { new: true }
    );

    if (!unit) {
      return res.status(409).json({
        success: false,
        message: "Unit not found, not verified, or not available",
      });
    }

    reservedUnitId = unit._id;

    // Only one admin assignment can win for a pending request.
    const updatedRequest = await EmergencyRequest.findOneAndUpdate(
      {
        _id: requestId,
        status: "pending",
      },
      {
        $set: {
          assignedUnit: unit._id,
          status: "assigned",
        },
      },
      { new: true, runValidators: true }
    ).populate("assignedUnit");

    if (!updatedRequest) {
      // Another assignment may have won; release our reservation.
      await Unit.updateOne(
        { _id: reservedUnitId, availability: "busy" },
        { $set: { availability: "available" } }
      );

      reservedUnitId = null;

      return res.status(409).json({
        success: false,
        message: "This emergency request has already been assigned",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Unit assigned successfully",
      request: updatedRequest,
    });
  } catch (error) {
    if (reservedUnitId) {
      await Unit.updateOne(
        { _id: reservedUnitId, availability: "busy" },
        { $set: { availability: "available" } }
      ).catch(() => {});
    }

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid request ID or unit ID",
      });
    }

    console.error("Assign unit error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to assign unit",
    });
  }
};


const assignHospitalToEmergency = async (req, res) => {
  try {
    const { hospitalId } = req.body;
    const { requestId } = req.params;

    if (!hospitalId) {
      return res.status(400).json({
        success: false,
        message: "Hospital ID is required",
      });
    }

    const hospital = await Hospital.findById(hospitalId);

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: "Hospital not found",
      });
    }

    if (hospital.verificationStatus !== "verified") {
      return res.status(400).json({
        success: false,
        message: "Only verified hospitals can be assigned",
      });
    }

    if (hospital.emergencyAvailability !== "accepting") {
      return res.status(400).json({
        success: false,
        message: "Hospital is not accepting emergencies",
      });
    }

    const emergency = await EmergencyRequest.findOneAndUpdate(
      {
        _id: requestId,
        status: {
          $in: ["pending", "assigned", "accepted", "en-route", "arrived"],
        },
      },
      {
        $set: {
          assignedHospital: hospital._id,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    )
      .populate("requester", "name email phone")
      .populate("assignedHospital");

    if (!emergency) {
      return res.status(404).json({
        success: false,
        message: "Active emergency request not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Hospital assigned successfully",
      data: emergency,
    });
  } catch (error) {
    console.error("Assign hospital error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid emergency or hospital ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to assign hospital",
    });
  }
};


const getAvailableHospitals = async (req, res) => {
  try {
    const hospitals = await Hospital.find({
      verificationStatus: "verified",
      emergencyAvailability: "accepting",
    })
      .select(
        "hospitalName registrationNumber address contactNumber emergencyCapacity emergencyAvailability"
      )
      .sort({ hospitalName: 1 });

    return res.status(200).json({
      success: true,
      count: hospitals.length,
      data: hospitals,
    });
  } catch (error) {
    console.error("Get available hospitals error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch available hospitals",
    });
  }
};


const getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalUnits,
      verifiedUnits,
      pendingUnits,
      totalHospitals,
      verifiedHospitals,
      pendingHospitals,
      totalEmergencies,
      pendingEmergencies,
      activeEmergencies,
      completedEmergencies,
    ] = await Promise.all([
      User.countDocuments({ role: "user" }),

      Unit.countDocuments(),
      Unit.countDocuments({ verificationStatus: "verified" }),
      Unit.countDocuments({ verificationStatus: "pending" }),

      Hospital.countDocuments(),
      Hospital.countDocuments({ verificationStatus: "verified" }),
      Hospital.countDocuments({ verificationStatus: "pending" }),

      EmergencyRequest.countDocuments(),
      EmergencyRequest.countDocuments({ status: "pending" }),
      EmergencyRequest.countDocuments({
        status: {
          $in: ["assigned", "accepted", "en-route", "arrived"],
        },
      }),
      EmergencyRequest.countDocuments({ status: "completed" }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
        },
        units: {
          total: totalUnits,
          verified: verifiedUnits,
          pending: pendingUnits,
        },
        hospitals: {
          total: totalHospitals,
          verified: verifiedHospitals,
          pending: pendingHospitals,
        },
        emergencies: {
          total: totalEmergencies,
          pending: pendingEmergencies,
          active: activeEmergencies,
          completed: completedEmergencies,
        },
      },
    });
  } catch (error) {
    console.error("Get dashboard stats error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard statistics",
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
getPendingEmergencies,
assignUnitToEmergency,
assignHospitalToEmergency,
getAvailableHospitals,
getDashboardStats
};
