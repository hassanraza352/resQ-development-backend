const jwt = require("jsonwebtoken");
const User = require("../model/User");

const protect = async (req, res, next) => {
try {
const token = req.cookies?.resq_token;

if (!token) {
  return res.status(401).json({
    success: false,
    message: "Authentication required. Please log in.",
  });
}

const decoded = jwt.verify(token, process.env.JWT_SECRET);

const user = await User.findById(decoded.id);

if (!user) {
  return res.status(401).json({
    success: false,
    message: "User account no longer exists",
  });
}

req.user = {
  id: user._id.toString(),
  role: user.role,
  email: user.email,
};

next();

} catch (error) {
if (error.name === "JsonWebTokenError" ||
error.name === "TokenExpiredError") {
return res.status(401).json({
success: false,
message: "Invalid or expired authentication token",
});
}

console.error("Authentication error:", error.message);

return res.status(500).json({
  success: false,
  message: "Authentication failed",
});


}
};

const authorize = (...allowedRoles) => {
return (req, res, next) => {
if (!req.user) {
return res.status(401).json({
success: false,
message: "Authentication required",
});
}


if (!allowedRoles.includes(req.user.role)) {
  return res.status(403).json({
    success: false,
    message: "You do not have permission to access this resource",
  });
}

next();


};
};

module.exports = {
protect,
authorize,
};
