const router = require("express").Router();
const { protect } = require("../Middlewares/authMiddleware");
const {
  addProduct,
  editProduct,
  deleteProduct,
  getProduct,
  getProducts,
  getProductByUser,
  sendEmail,
  getFilteredProducts,
} = require("../Controllers/productController");
const upload = require("../config/multer");

router.post("/addproduct", protect, upload.array("images", 5), addProduct);
router.put("/editproduct/:id", protect, editProduct);
router.delete("/deleteproduct/:id", protect, deleteProduct);
router.get("/getproduct/:id", getProduct);
router.get("/getproducts", getProducts);
router.get("/getproduct_by_user/:id", getProductByUser);
router.post("/email", sendEmail);
router.get("/", getFilteredProducts);
module.exports = router;
