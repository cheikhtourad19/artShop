const User = require("../../Models/User");
const Product = require("../../Models/Product");
const validator = require("validator");

const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    await user.deleteOne();
    res.status(200).json({ msg: "User deleted successfully" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ msg: "Server error during deletion" });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json({ users });
  } catch (err) {
    console.error("Fetch users error:", err);
    res.status(500).json({ msg: "Server error fetching users" });
  }
};
const editUserInfo = async (req, res) => {
  const { nom, prenom, phone, email } = req.body;
  const userId = req.params.id;
  if (!nom || !prenom || !email || !phone) {
    return res.status(400).json({ msg: "Please enter all required fields" });
  }
  if (!validator.isEmail(email)) {
    return res.status(400).json({ msg: "Please enter a valid email" });
  }
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    user.nom = nom.trim();
    user.prenom = prenom.trim();
    user.phone = phone;
    user.email = email.toLowerCase();
    await user.save();
    res.status(200).json({
      msg: "User information updated successfully",
      user: {
        id: user._id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ msg: "Server error during update" });
  }
};

const editPassword = async (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;
  if (!id || !newPassword) {
    return res
      .status(400)
      .json({ msg: "Please enter all required fields!!!!", req: req.body });
  }
  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    user.password = newPassword;
    await user.save();
    res.status(200).json({ msg: "Password updated successfully" });
  } catch (err) {
    console.error("Password update error:", err);
    res.status(500).json({ msg: "Server error during password update" });
  }
};

const loadUserInfo = async (req, res) => {
  user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ msg: "User not found" });
  }
  res.status(200).json({
    user: {
      id: user._id,
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      phone: user.phone,
    },
  });
};

const getStat = async (req, res) => {
  try {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const totalUsers = await User.countDocuments();

    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: firstDayOfMonth },
    });

    const totalProducts = await Product.countDocuments();

    const newProductsThisMonth = await Product.countDocuments({
      createdAt: { $gte: firstDayOfMonth },
    });

    const firstDayOfLastMonth = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1
    );
    const firstDayOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const usersLastMonth = await User.countDocuments({
      createdAt: {
        $gte: firstDayOfLastMonth,
        $lt: firstDayOfThisMonth,
      },
    });

    const productsLastMonth = await Product.countDocuments({
      createdAt: {
        $gte: firstDayOfLastMonth,
        $lt: firstDayOfThisMonth,
      },
    });

    const userGrowth =
      usersLastMonth > 0
        ? (
            ((newUsersThisMonth - usersLastMonth) / usersLastMonth) *
            100
          ).toFixed(2)
        : 100;

    const productGrowth =
      productsLastMonth > 0
        ? (
            ((newProductsThisMonth - productsLastMonth) / productsLastMonth) *
            100
          ).toFixed(2)
        : 100;

    res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          newThisMonth: newUsersThisMonth,
          lastMonth: usersLastMonth,
          growth: `${userGrowth}%`,
        },
        products: {
          total: totalProducts,
          newThisMonth: newProductsThisMonth,
          lastMonth: productsLastMonth,
          growth: `${productGrowth}%`,
        },
        date: now.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching statistics",
      error: error.message,
    });
  }
};

module.exports = {
  deleteUser,
  getAllUsers,
  editUserInfo,
  editPassword,
  loadUserInfo,
  getStat,
};
