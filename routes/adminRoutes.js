const { admin } = require("../Middlewares/adminMiddleware");
const router = require("express").Router();
const {
  getAllUsers,
  deleteUser,
  editUserInfo,
  editPassword,
  loadUserInfo,
  getStat,
} = require("../Controllers/admin/adminController");

router.get("/stat", admin, getStat);
router.get("/users/:id", admin, loadUserInfo);
router.get("/users", admin, getAllUsers);
router.delete("/users/:id", admin, deleteUser);
router.put("/users/:id", admin, editUserInfo);
router.put("/users/:id/password", admin, editPassword);
router.get("/stat", admin, getStat);
/*
{
  "success": true,
  "data": {
    "users": {
      "total": 1500,
      "newThisMonth": 150,
      "lastMonth": 120,
      "growth": "25.00%"
    },
    "products": {
      "total": 5000,
      "newThisMonth": 300,
      "lastMonth": 250,
      "growth": "20.00%"
    }
  }
}
*/

module.exports = router;
