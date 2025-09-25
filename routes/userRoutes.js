const router = require("express").Router();
const {
  loadUserInfo,
  editUserInfo,
  editPassword,
} = require("../Controllers/userController");
const { protect } = require("../Middlewares/authMiddleware");

router.get("/profile", protect, loadUserInfo);

router.put("/profile", protect, editUserInfo);

router.put("/profile/password", protect, editPassword);

module.exports = router;
