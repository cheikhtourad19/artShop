const User = require("../Models/User");
const validator = require("validator");
const Profile = require("../Models/Profile");

const { cloudinary } = require("../config/cloudinary");
const { raw } = require("express");
require("dotenv").config();

const loadUserInfo = async (req, res) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    user: {
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      phone: user.phone,
    },
  });
};
const loadBio = async (req, res) => {
  try {
    const id = req.params.id;
    const user = await User.findById(id);
    const profile = await Profile.findOne({ user: user._id });
    res.status(200).json({
      user: profile.user,
      bio: profile.bio,
      image: profile.image,
    });
  } catch (error) {}
};

const editUserPicture = async (req, res) => {
  try {
    const user = req.user;
    if (!req.file) {
      return res.status(400).json({ msg: "No image file provided" });
    }

    // Upload buffer to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: "profile_pictures" },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(req.file.buffer);
    });

    let profile = await Profile.findOne({ user: user.id });
    if (!profile) {
      profile = await Profile.create({ user: user.id });
    }

    // Delete old image if exists
    if (profile.image?.public_id) {
      await cloudinary.uploader.destroy(profile.image.public_id);
    }

    profile.image = {
      url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
    };
    await profile.save();

    res.status(200).json({
      msg: "Profile picture updated successfully",
      image: profile.image,
    });
  } catch (error) {
    console.error("Picture upload error:", error);
    res
      .status(500)
      .json({ msg: `Server error during picture update: ${error.message}` });
  }
};

const editUserBio = async (req, res) => {
  try {
    const user = req.user;
    const { bio } = req.body;
    let profile = await Profile.findOne({ user });
    if (!profile) {
      profile = await Profile.create({ user });
    }
    profile.bio = bio;
    await profile.save();
    res.status(200).json({
      msg: "Profile bio updated successfully",
      bio: profile.bio,
    });
  } catch (error) {}
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

module.exports = {
  loadUserInfo,
  editUserInfo,
  editPassword,
  editUserBio,
  editUserPicture,
  loadBio,
};
