const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
{
name: {
type: String,
required: [true, "Name is required"],
trim: true,
},

email: {
  type: String,
  required: [true, "Email is required"],
  unique: true,
  lowercase: true,
  trim: true,
},

password: {
  type: String,
  required: [true, "Password is required"],
  minlength: 8,
  select: false,
},

phone: {
  type: String,
  default: "+92 XXXXXXXXX",
  trim: true,
},

role: {
  type: String,
  enum: ["user", "unit", "hospital", "admin"],
  default: "user",
},

isVerified: {
  type: Boolean,
  default: false,
},
},
{
timestamps: true,
}
);

const User = mongoose.model("User", userSchema);

module.exports = User;
