const User = require("../Models/User");
const validator = require("validator");

const loadUserInfo = async (req, res) => {
  user = await User.findById(req.user.id);
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

const editUserInfo = async (req, res) => {
  const { nom, prenom, phone, email } = req.body;
  if (!nom || !prenom || !email || !phone) {
    return res.status(400).json({ msg: "Please enter all required fields!!" });
  }
  if (!validator.isEmail(email)) {
    return res.status(400).json({ msg: "Please enter a valid email" });
  }
  try {
    const user = await User.findById(req.user.id);
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
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ msg: "Please enter all required fields" });
  }
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ msg: "Current password is incorrect" });
    }
    if (newPassword.length < 8) {
      return res
        .status(400)
        .json({ msg: "New password must be at least 8 characters" });
    }
    user.password = newPassword;
    await user.save();
    res.status(200).json({ msg: "Password updated successfully" });
  } catch (err) {
    console.error("Password update error:", err);
    res.status(500).json({ msg: "Server error during password update" });
  }
};

module.exports = { loadUserInfo, editUserInfo, editPassword };
