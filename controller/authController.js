const User = require("../model/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Register a new user
const registerUser = async (req, res) => {
try {
const { name, email, password, phone } = req.body;

// Check required fields
if (!name || !email || !password || !phone) {
  return res.status(400).json({
    success: false,
    message: "Please provide name, email, password and phone",
  });
}

// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if (!emailRegex.test(email)) {
  return res.status(400).json({
    success: false,
    message: "Please provide a valid email address",
  });
}

// Validate password length
if (password.length < 8) {
  return res.status(400).json({
    success: false,
    message: "Password must be at least 8 characters long",
  });
}

// Check if user already exists
const existingUser = await User.findOne({
  email: email.toLowerCase().trim(),
});

if (existingUser) {
  return res.status(409).json({
    success: false,
    message: "An account with this email already exists",
  });
}

// Hash password
const hashedPassword = await bcrypt.hash(password, 12);

// Create user
const user = await User.create({
  name,
  email: email.toLowerCase().trim(),
  password: hashedPassword,
  phone,
  role: "user",
});

// Send response without password
return res.status(201).json({
  success: true,
  message: "Account created successfully",
  user: {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isVerified: user.isVerified,
  },
});

} catch (error) {
console.error("Registration error:", error.message);

// Handle duplicate email index errors
if (error.code === 11000) {
  return res.status(409).json({
    success: false,
    message: "An account with this email already exists",
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



// Generate JWT token
const generateToken = (user) => {
return jwt.sign(
{
id: user._id.toString(),
role: user.role,
},
process.env.JWT_SECRET,
{
expiresIn: process.env.JWT_EXPIRES_IN || "7d",
}
);
};

// Cookie configuration
const cookieOptions = {
httpOnly: true,
secure: process.env.NODE_ENV === "production",
sameSite: "lax",
maxAge: 7 * 24 * 60 * 60 * 1000,
path: "/",
};

// Login user
const loginUser = async (req, res) => {
try {
const { email, password } = req.body;

if (!email || !password) {
  return res.status(400).json({
    success: false,
    message: "Email and password are required",
  });
}

const normalizedEmail = email.toLowerCase().trim();

const user = await User.findOne({
  email: normalizedEmail,
}).select("+password");

if (!user) {
  return res.status(401).json({
    success: false,
    message: "Invalid email or password",
  });
}

const isPasswordCorrect = await bcrypt.compare(
  password,
  user.password
);

if (!isPasswordCorrect) {
  return res.status(401).json({
    success: false,
    message: "Invalid email or password",
  });
}

const token = generateToken(user);

res.cookie("resq_token", token, cookieOptions);

return res.status(200).json({
  success: true,
  message: "Login successful",
  user: {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isVerified: user.isVerified,
  },
});


} catch (error) {
console.error("Login error:", error.message);


return res.status(500).json({
  success: false,
  message: "Internal server error",
});


}
};

// Logout user
const logoutUser = (req, res) => {
res.clearCookie("resq_token", {
httpOnly: true,
secure: process.env.NODE_ENV === "production",
sameSite: "lax",
path: "/",
});

return res.status(200).json({
success: true,
message: "Logout successful",
});
};

// Get current logged-in user
const getMe = async (req, res) => {
try {
const user = await User.findById(req.user.id);

if (!user) {
  return res.status(401).json({
    success: false,
    message: "User account no longer exists",
  });
}

return res.status(200).json({
  success: true,
  user: {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isVerified: user.isVerified,
  },
});


} catch (error) {
console.error("Get current user error:", error.message);


return res.status(500).json({
  success: false,
  message: "Internal server error",
});

}
};


module.exports = {
registerUser,
loginUser,
logoutUser,
getMe,
};
