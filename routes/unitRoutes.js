const express = require("express");

const {
registerUnit,
getMyUnit,
} = require("../controller/unitController");

const {
protect,
authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
"/register",
protect,
authorize("unit"),
registerUnit
);

router.get(
"/me",
protect,
authorize("unit"),
getMyUnit
);

module.exports = router;
