const { admin } = require("../Middlewares/adminMiddleware");
const router = require("express").Router();
const {
  getAllUsers,
  deleteUser,
  editUserInfo,
  editPassword,
  loadUserInfo,
} = require("../Controllers/admin/adminController");

router.get("/users/:id", admin, loadUserInfo);
router.get("/users", admin, getAllUsers);
router.delete("/users/:id", admin, deleteUser); // Add :id parameter
router.put("/users/:id", admin, editUserInfo);
router.put("/users/:id/password", admin, editPassword);

module.exports = router;
