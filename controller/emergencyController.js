
const EmergencyRequest = require("../model/EmergencyRequest");

const createEmergencyRequest = async (req, res) => {
  try {
    const {
      emergencyType,
      description,
      contactNumber,
      address,
      coordinates,
    } = req.body;

    if (!emergencyType || !contactNumber || !address || !coordinates) {
      return res.status(400).json({
        success: false,
        message:
          "Emergency type, contact number, address and coordinates are required",
      });
    }

    const allowedTypes = [
      "medical",
      "accident",
      "cardiac",
      "pregnancy",
      "fire",
      "other",
    ];

    if (!allowedTypes.includes(emergencyType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid emergency type",
      });
    }

    if (
      !Array.isArray(coordinates) ||
      coordinates.length !== 2 ||
      !coordinates.every(
        (coordinate) =>
          typeof coordinate === "number" &&
          Number.isFinite(coordinate)
      ) ||
      coordinates[0] < -180 ||
      coordinates[0] > 180 ||
      coordinates[1] < -90 ||
      coordinates[1] > 90
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Coordinates must be [longitude, latitude] with valid values",
      });
    }

    const activeRequest = await EmergencyRequest.findOne({
      requester: req.user.id,
      status: {
        $in: ["pending", "assigned", "accepted", "en-route", "arrived"],
      },
    });

    if (activeRequest) {
      return res.status(409).json({
        success: false,
        message: "You already have an active emergency request",
        request: activeRequest,
      });
    }

    const emergencyRequest = await EmergencyRequest.create({
      requester: req.user.id,
      emergencyType,
      description: description || "",
      contactNumber,
      location: {
        address,
        coordinates,
      },
      status: "pending",
    });

    return res.status(201).json({
      success: true,
      message: "Emergency request created successfully",
      request: emergencyRequest,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Create emergency request error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to create emergency request",
    });
  }
};

const getMyEmergencyRequests = async (req, res) => {
  try {
    const requests = await EmergencyRequest.find({
      requester: req.user.id,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: requests.length,
      requests,
    });
  } catch (error) {
    console.error("Get emergency requests error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve emergency requests",
    });
  }
};

const getEmergencyRequestById = async (req, res) => {
  try {
    const request = await EmergencyRequest.findOne({
      _id: req.params.requestId,
      requester: req.user.id,
    }).populate("assignedUnit");

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Emergency request not found",
      });
    }

    return res.status(200).json({
      success: true,
      request,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid emergency request ID",
      });
    }

    console.error("Get emergency request error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve emergency request",
    });
  }
};

const cancelEmergencyRequest = async (req, res) => {
  try {
    const request = await EmergencyRequest.findOne({
      _id: req.params.requestId,
      requester: req.user.id,
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Emergency request not found",
      });
    }

    if (request.status !== "pending") {
      return res.status(400).json({
        success: false,
        message:
          "Only pending requests can be cancelled by the requester",
      });
    }

    request.status = "cancelled";
    request.cancelledAt = new Date();

    await request.save();

    return res.status(200).json({
      success: true,
      message: "Emergency request cancelled successfully",
      request,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid emergency request ID",
      });
    }

    console.error("Cancel emergency request error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to cancel emergency request",
    });
  }
};

module.exports = {
  createEmergencyRequest,
  getMyEmergencyRequests,
  getEmergencyRequestById,
  cancelEmergencyRequest,
};
