const router = require("express").Router();

const {
  register,
  login,
  getResetToken,
  reset,
  googleAuth,
} = require("../Controllers/authController");
const { protect } = require("../Middlewares/authMiddleware");
router.post("/register", register);
router.post("/login", login);
router.post("/reset-password", getResetToken);
router.post("/google", googleAuth);
router.post("/reset-password/:token", reset);

module.exports = router;
