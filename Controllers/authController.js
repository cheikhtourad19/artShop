const User = require("../Models/User");
const jwt = require("jsonwebtoken");
const validator = require("validator");
const Reset = require("../Models/Reset");
const crypto = require("crypto");
const transporter = require("../utils/sendEmail");
require("dotenv").config();
// path to transporter

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

const register = async (req, res) => {
  try {
    const { nom, prenom, phone, email, password, isAdmin = false } = req.body;

    if (!nom || !prenom || !email || !password || !phone) {
      return res.status(400).json({ msg: "Please enter all required fields" });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ msg: "Please enter a valid email" });
    }

    if (password.length < 8) {
      return res.status(400).json({
        msg: "Password must be at least 8 characters long",
      });
    }

    const existingUser = await User.findOne({
      email,
    });

    if (existingUser) {
      return res.status(400).json({
        msg: `User with this email already exists`,
      });
    }

    const newUser = new User({
      nom: nom.trim(),
      prenom: prenom.trim(),
      phone,
      email: email.toLowerCase(),
      password,
      isAdmin,
    });

    await newUser.save();

    res.status(201).json({
      msg: "User registered successfully",
      user: {
        id: newUser._id,
        nom: newUser.nom,
        prenom: newUser.prenom,
        email: newUser.email,
        isAdmin: newUser.isAdmin,
      },
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ msg: "Server error during registration" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ msg: "Please enter email and password" });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ msg: "Please enter a valid email" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ msg: "Invalid credentials" });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ msg: "Invalid credentials" });
    }

    res.status(200).json({
      msg: "Login successful",
      user: {
        id: user._id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        isAdmin: user.isAdmin,
      },
      token: generateToken(user._id),
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ msg: "Server error during login" });
  }
};

const getResetToken = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ msg: "Please enter your email" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ msg: "Utilisateur n'existe pas" });
    }

    // Remove old tokens (optional)
    await Reset.deleteMany({ user: user._id });

    const resetToken = crypto.randomBytes(32).toString("hex");

    const newReset = new Reset({
      user: user._id,
      token: resetToken,
      expires: new Date(Date.now() + 3600000), // 1h
    });
    await newReset.save();
    console.log("EMAIL_USER:", process.env.EMAIL_USER);
    console.log("EMAIL_PASS:", process.env.EMAIL_PASS);

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}?id=${user._id}`;

    await transporter.sendMail({
      from: `"Support" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Réinitialisation de votre mot de passe",
      html: `
        <p>Bonjour ${user.name || ""},</p>
        <p>Cliquez sur le lien ci-dessous pour réinitialiser votre mot de passe :</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>Ce lien expire dans 1 heure.</p>
      `,
    });

    return res.status(200).json({ msg: "Email envoyé" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "Erreur serveur" });
  }
};

const reset = async (req, res) => {
  const token = req.params.token;
  const password = req.body.password;

  if (!password) {
    return res.status(400).json({ msg: "Veuillez entrer un mot de passe" });
  }

  if (password.length < 8) {
    return res
      .status(400)
      .json({ msg: "Le mot de passe doit contenir au moins 8 caractères" });
  }

  const request = await Reset.findOne({ token });
  if (!request) {
    return res.status(400).json({ msg: "Token invalide ou expiré" });
  }

  if (request.expires < Date.now()) {
    await Reset.deleteOne({ _id: request._id });
    return res.status(400).json({ msg: "Token invalide ou expiré" });
  }

  const user = await User.findById(request.user);
  if (!user) {
    return res.status(404).json({ msg: "Utilisateur n'existe pas" });
  }

  user.password = password;
  await user.save();
  await Reset.deleteOne({ _id: request._id });

  res.status(200).json({ msg: "Mot de passe réinitialisé avec succès" });
};

module.exports = { register, login, getResetToken, reset };
