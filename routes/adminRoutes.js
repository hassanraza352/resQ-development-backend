const express = require("express");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
"/dashboard",
protect,
authorize("admin"),
(req, res) => {
return res.status(200).json({
success: true,
message: "Welcome to the ResQ Admin Dashboard",
admin: req.user,
});
}
);

module.exports = router;
