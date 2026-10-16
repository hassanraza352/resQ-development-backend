
const Hospital = require("../model/Hospital");
const EmergencyRequest = require("../model/EmergencyRequest");

const registerHospital = async (req, res) => {
  try {
    const {
      hospitalName,
      registrationNumber,
      address,
      contactNumber,
      emergencyCapacity,
    } = req.body;

    if (
      !hospitalName ||
      !registrationNumber ||
      !address ||
      !contactNumber ||
      emergencyCapacity === undefined ||
      emergencyCapacity === null ||
      emergencyCapacity === ""
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required hospital details",
      });
    }

    const capacity = Number(emergencyCapacity);

    if (!Number.isInteger(capacity) || capacity < 0) {
      return res.status(400).json({
        success: false,
        message: "Emergency capacity must be a non-negative integer",
      });
    }

    const normalizedRegistrationNumber =
      registrationNumber.trim().toUpperCase();

    const existingHospital = await Hospital.findOne({
      $or: [
        { user: req.user.id },
        { registrationNumber: normalizedRegistrationNumber },
      ],
    });

    if (existingHospital) {
      return res.status(409).json({
        success: false,
        message:
          "A hospital profile already exists for this user or registration number",
      });
    }

    const hospital = await Hospital.create({
      user: req.user.id,
      hospitalName,
      registrationNumber: normalizedRegistrationNumber,
      address,
      contactNumber,
      emergencyCapacity: capacity,
      verificationStatus: "pending",
      emergencyAvailability: "not-accepting",
    });

    return res.status(201).json({
      success: true,
      message: "Hospital registered. Waiting for admin approval.",
      hospital,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Hospital profile or registration number already exists",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Hospital registration error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to register hospital",
    });
  }
};

const getMyHospital = async (req, res) => {
  try {
    const hospital = await Hospital.findOne({
      user: req.user.id,
    });

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: "Hospital profile not found. Please register first.",
      });
    }

    return res.status(200).json({
      success: true,
      hospital,
    });
  } catch (error) {
    console.error("Get hospital profile error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve hospital profile",
    });
  }
};


const updateHospitalAvailability = async (req, res) => {
  try {
    const { emergencyAvailability } = req.body;

    if (
      !["accepting", "not-accepting"].includes(emergencyAvailability)
    ) {
      return res.status(400).json({
        success: false,
        message: "Availability must be accepting or not-accepting",
      });
    }

    const hospital = await Hospital.findOne({
      user: req.user.id,
    });

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: "Hospital profile not found",
      });
    }

    if (hospital.verificationStatus !== "verified") {
      return res.status(403).json({
        success: false,
        message: "Hospital must be verified by admin first",
      });
    }

    hospital.emergencyAvailability = emergencyAvailability;
    await hospital.save();

    return res.status(200).json({
      success: true,
      message: "Hospital availability updated",
      data: {
        emergencyAvailability: hospital.emergencyAvailability,
      },
    });
  } catch (error) {
    console.error("Update hospital availability:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update availability",
    });
  }
};

const getHospitalEmergencyRequests = async (req, res) => {
  try {
    const hospital = await Hospital.findOne({
      user: req.user.id,
    });

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: "Hospital profile not found",
      });
    }

    if (hospital.verificationStatus !== "verified") {
      return res.status(403).json({
        success: false,
        message: "Hospital must be verified first",
      });
    }

    const emergencies = await EmergencyRequest.find({
      assignedHospital: hospital._id,
      status: {
        $in: [
          "pending",
          "assigned",
          "accepted",
          "en-route",
          "arrived",
        ],
      },
    })
      .populate("requester", "name email phone")
      .populate("assignedUnit")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: emergencies.length,
      data: emergencies,
    });
  } catch (error) {
    console.error("Get hospital emergencies:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch hospital emergencies",
    });
  }
};


module.exports = {
  registerHospital,
  getMyHospital,
  updateHospitalAvailability,
  getHospitalEmergencyRequests,
};