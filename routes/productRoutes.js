const router = require("express").Router();
const { protect } = require("../Middlewares/authMiddleware");
const {
  addProduct,
  editProduct,
  deleteProduct,
  getProduct,
  getProducts,
  getProductByUser,
} = require("../Controllers/productController");
const upload = require("../config/multer");

router.post("/addproduct", protect, upload.array("images", 5), addProduct);
router.put("/editproduct", protect, editProduct);
router.delete("/deleteproduct/:id", protect, deleteProduct);
router.get("/getproduct/:id", getProduct);
router.get("/getproducts", getProducts);
router.get("/getproduct_by_user/:id", getProductByUser);

module.exports = router;
