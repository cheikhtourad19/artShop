const User = require("../../Models/User");
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
    return res.status(400).json({ msg: "Please enter all required fields!!" });
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
  const { id, newPassword } = req.body;
  console.log(id, newPassword);
  if (!id || !newPassword) {
    return res.status(400).json({ msg: "Please enter all required fields!!" });
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

module.exports = { deleteUser, getAllUsers, editUserInfo, editPassword };
