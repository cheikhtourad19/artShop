const { admin } = require("../Middlewares/adminMiddleware");
const router = require("express").Router();
const {
  getAllUsers,
  deleteUser,
  editUserInfo,
  editPassword,
} = require("../Controllers/admin/adminController");

router.get("/users", admin, getAllUsers);
router.delete("/users/:id", admin, deleteUser);
router.put("/users/:id", admin, editUserInfo);
router.put("/users/password", admin, editPassword);

module.exports = router;
