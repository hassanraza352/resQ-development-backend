const Unit = require("../model/Unit");
const EmergencyRequest = require("../model/EmergencyRequest");
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


const getAvailableUnits = async (req, res) => {
  try {
    const units = await Unit.find({
      verificationStatus: "verified",
      availability: "available",
    }).populate("user", "name phone");

    return res.status(200).json({
      success: true,
      count: units.length,
      units,
    });
  } catch (error) {
    console.error("Get available units error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve available units",
    });
  }
};

const updateUnitAvailability = async (req, res) => {
  try {
    const { availability } = req.body;

    const allowedStatuses = ["available", "offline"];

    if (!allowedStatuses.includes(availability)) {
      return res.status(400).json({
        success: false,
        message: "Availability must be available or offline",
      });
    }

    const unit = await Unit.findOne({ user: req.user.id });

    if (!unit) {
      return res.status(404).json({
        success: false,
        message: "Unit profile not found",
      });
    }

    if (unit.verificationStatus !== "verified") {
      return res.status(403).json({
        success: false,
        message: "Your unit must be verified by an admin first",
      });
    }

    if (unit.availability === "busy") {
      return res.status(409).json({
        success: false,
        message: "A busy unit cannot change its availability",
      });
    }

    unit.availability = availability;
    await unit.save();

    return res.status(200).json({
      success: true,
      message: "Unit availability updated",
      unit,
    });
  } catch (error) {
    console.error("Update unit availability error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to update unit availability",
    });
  }
};


const getMyAssignedEmergencies = async (req, res) => {
  try {
    const unit = await Unit.findOne({ user: req.user.id });

    if (!unit) {
      return res.status(404).json({
        success: false,
        message: "Unit profile not found",
      });
    }

    const requests = await EmergencyRequest.find({
      assignedUnit: unit._id,
      status: {
        $in: ["assigned", "accepted", "en-route", "arrived"],
      },
    })
      .populate("requester", "name phone")
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      count: requests.length,
      requests,
    });
  } catch (error) {
    console.error("Get assigned emergencies error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve assigned emergencies",
    });
  }
};

const updateEmergencyStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { requestId } = req.params;

    const allowedTransitions = {
      assigned: "accepted",
      accepted: "en-route",
      "en-route": "arrived",
      arrived: "completed",
    };

    const unit = await Unit.findOne({ user: req.user.id });

    if (!unit) {
      return res.status(404).json({
        success: false,
        message: "Unit profile not found",
      });
    }

    const request = await EmergencyRequest.findOne({
      _id: requestId,
      assignedUnit: unit._id,
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Assigned emergency request not found",
      });
    }

    const expectedNextStatus = allowedTransitions[request.status];

    if (!expectedNextStatus || status !== expectedNextStatus) {
      return res.status(400).json({
        success: false,
        message: "Invalid status transition",
        currentStatus: request.status,
        allowedNextStatus: expectedNextStatus || null,
      });
    }

    // Update only if the status has not changed since it was read.
    const updatedRequest = await EmergencyRequest.findOneAndUpdate(
      {
        _id: request._id,
        assignedUnit: unit._id,
        status: request.status,
      },
      {
        $set: { status },
      },
      {
        new: true,
        runValidators: true,
      }
    ).populate("requester", "name phone");

    if (!updatedRequest) {
      return res.status(409).json({
        success: false,
        message: "Request status changed. Refresh and try again.",
      });
    }

    if (status === "completed") {
      // Release the unit only if it has no other active assignments.
      const anotherActiveRequest = await EmergencyRequest.exists({
        assignedUnit: unit._id,
        _id: { $ne: updatedRequest._id },
        status: { $in: ["assigned", "accepted", "en-route", "arrived"] },
      });

      if (!anotherActiveRequest) {
        await Unit.updateOne(
          { _id: unit._id, availability: "busy" },
          { $set: { availability: "available" } }
        );
      }
    }

    return res.status(200).json({
      success: true,
      message: `Emergency status updated to ${status}`,
      request: updatedRequest,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid emergency request ID",
      });
    }

    console.error("Update emergency status error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to update emergency status",
    });
  }
};


module.exports = {
  registerUnit,
  getMyUnit,
  getAvailableUnits,
  updateUnitAvailability,
  getMyAssignedEmergencies,
  updateEmergencyStatus,
};
