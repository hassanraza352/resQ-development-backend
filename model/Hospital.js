
const mongoose = require("mongoose");

const hospitalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    hospitalName: {
      type: String,
      required: [true, "Hospital name is required"],
      trim: true,
    },

    registrationNumber: {
      type: String,
      required: [true, "Hospital registration number is required"],
      unique: true,
      trim: true,
      uppercase: true,
    },

    address: {
      type: String,
      required: [true, "Hospital address is required"],
      trim: true,
    },

    contactNumber: {
      type: String,
      required: [true, "Contact number is required"],
      trim: true,
    },

    emergencyCapacity: {
      type: Number,
      required: [true, "Emergency capacity is required"],
      min: 0,
    },

    verificationStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },

    emergencyAvailability: {
      type: String,
      enum: ["accepting", "not-accepting"],
      default: "not-accepting",
    },
  },
  { timestamps: true }
);

const Hospital = mongoose.model("Hospital", hospitalSchema);

module.exports = Hospital;