
const mongoose = require("mongoose");

const emergencyRequestSchema = new mongoose.Schema(
  {
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    emergencyType: {
      type: String,
      enum: [
        "medical",
        "accident",
        "cardiac",
        "pregnancy",
        "fire",
        "other",
      ],
      required: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    contactNumber: {
      type: String,
      required: true,
      trim: true,
    },

    location: {
      address: {
        type: String,
        required: true,
        trim: true,
      },
      coordinates: {
        type: [Number],
        required: true,
        validate: {
          validator: function (value) {
            return (
              Array.isArray(value) &&
              value.length === 2 &&
              value.every(Number.isFinite) &&
              value[0] >= -180 &&
              value[0] <= 180 &&
              value[1] >= -90 &&
              value[1] <= 90
            );
          },
          message:
            "Coordinates must be [longitude, latitude] within valid ranges",
        },
      },
    },

    status: {
      type: String,
      enum: [
        "pending",
        "assigned",
        "accepted",
        "en-route",
        "arrived",
        "completed",
        "cancelled",
      ],
      default: "pending",
      index: true,
    },

    assignedUnit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Unit",
      default: null,
    },
    assignedHospital: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Hospital",
  default: null,
  index: true,
},


    cancelledAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

emergencyRequestSchema.index({
  "location.coordinates": "2dsphere",
});

const EmergencyRequest = mongoose.model(
  "EmergencyRequest",
  emergencyRequestSchema
);

module.exports = EmergencyRequest;
