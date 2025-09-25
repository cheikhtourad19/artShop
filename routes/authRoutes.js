const router = require("express").Router();

const { register, login, protected } = require("../Controllers/authController");
const { protect } = require("../Middlewares/authMiddleware");
router.post("/register", register);
router.post("/login", login);
router.post("/protected", protect, protected);

module.exports = router;
