const router = require("express").Router();
const {
  loadUserInfo,
  editUserInfo,
  editPassword,
  editUserBio,
  editUserPicture,
  loadBio,
  loadPublicUserInfo,
} = require("../Controllers/userController");
const { protect } = require("../Middlewares/authMiddleware");
const multer = require("multer");

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});
router.get("/profile", protect, loadUserInfo);

router.get("/profile/:id", loadPublicUserInfo);

router.get("/profile/bio/:id", loadBio);
router.put("/profile", protect, editUserInfo);

router.put("/profile/password", protect, editPassword);

router.put("/profile/bio", protect, editUserBio);

router.put(
  "/profile/picture",
  protect,
  upload.single("image"),
  editUserPicture
);

module.exports = router;
