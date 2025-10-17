// aiRoutes.js
const router = require("express").Router();
const { protect } = require("../Middlewares/authMiddleware");
const { generateProductImage } = require("../Controllers/aiController");
const multer = require("multer");

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Add upload.single('image') middleware before enhanceImage
router.post(
  "/enhance-image",
  protect,
  upload.single("image"),
  generateProductImage
);

module.exports = router;
