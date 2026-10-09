const mongoose = require("mongoose");

const unitSchema = new mongoose.Schema(
{
// Driver / unit account
user: {
type: mongoose.Schema.Types.ObjectId,
ref: "User",
required: true,
unique: true,
},

// Ambulance identification
registrationNumber: {
  type: String,
  required: [true, "Registration number is required"],
  unique: true,
  trim: true,
  uppercase: true,
},

vehicleModel: {
  type: String,
  required: [true, "Vehicle model is required"],
  trim: true,
},

vehicleType: {
  type: String,
  enum: ["basic", "advanced", "patient-transport"],
  required: true,
},

// Unit availability
availability: {
  type: String,
  enum: ["available", "busy", "offline"],
  default: "offline",
},

// Verification by admin
verificationStatus: {
  type: String,
  enum: ["pending", "verified", "rejected"],
  default: "pending",
},

// Current ambulance location
location: {
  type: {
    type: String,
    enum: ["Point"],
    default: "Point",
  },

  coordinates: {
    type: [Number],
    default: undefined,
  },
},

// Contact and capacity
contactNumber: {
  type: String,
  required: [true, "Contact number is required"],
  trim: true,
},

capacity: {
  type: Number,
  required: [true, "Capacity is required"],
  min: 1,
},

},
{
timestamps: true,
}
);

// Geospatial index for nearby-unit searches
unitSchema.index({ location: "2dsphere" });

const Unit = mongoose.model("Unit", unitSchema);

module.exports = Unit;
