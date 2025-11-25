const User = require("../Models/User");
const Profile = require("../Models/Profile"); // Add this import
const jwt = require("jsonwebtoken");
const validator = require("validator");
const Reset = require("../Models/Reset");
const crypto = require("crypto");
const transporter = require("../utils/sendEmail");
require("dotenv").config();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

const register = async (req, res) => {
  try {
    const {
      nom,
      prenom,
      phone,
      email,
      password,
      isAdmin = false,
      isLivreur = false,
    } = req.body;

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
      isLivreur,
    });

    await newUser.save();

    res.status(201).json({
      msg: "User registered successfully",
      newUser,
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
    console.log("EMAIL:", email);
    console.log("PASSWORD:", password);
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
      user,
      token: generateToken(user._id),
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ msg: "Server error during login" });
  }
};

// Google Sign-In with Profile Picture
const googleAuth = async (req, res) => {
  try {
    const { email, fullName, profilePicture } = req.body;

    // Validate required fields
    if (!email || !fullName) {
      return res.status(400).json({
        success: false,
        msg: "Missing required fields",
      });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({
        success: false,
        msg: "Please enter a valid email",
      });
    }

    // Check if user exists
    let user = await User.findOne({ email: email.toLowerCase() });
    let isNewUser = false;

    if (!user) {
      // Create new user with Google data
      user = new User({
        nom: fullName.trim(),
        prenom: fullName.trim(),
        email: email.toLowerCase(),
        phone: "From Google", // Default phone
        password: "GoogleUser12345678", // Default password for Google users
        isAdmin: false,
        isLivreur: false,
      });

      await user.save();
      isNewUser = true;

      // Create profile for the new user
      const newProfile = new Profile({
        user: user._id,
        bio: "",
        image: profilePicture
          ? {
              url: profilePicture,
              public_id: "google_profile", // Since it's from Google, not from your storage
            }
          : undefined,
      });

      await newProfile.save();
      await transporter.sendMail({
        from: `"Support" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: "Votre compte a été créé avec succès",
        html: `
        <p>Bonjour ${user.nom || ""},</p>
        <p>Votre compte a été créé avec succès et votre mot passe par defaut est GoogleUser12345678 veiller le changer vite </p>
        
      `,
      });

      res.status(201).json({
        success: true,
        msg: "Account created successfully",
        user: {
          _id: user._id,
          email: user.email,
          nom: user.nom,
          prenom: user.prenom,
          phone: user.phone,
          isAdmin: user.isAdmin,
          isLivreur: user.isLivreur,
        },
        token: generateToken(user._id),
        isNewUser: true,
      });
    } else {
      // User exists, check if profile exists
      let profile = await Profile.findOne({ user: user._id });

      if (!profile) {
        // Create profile if it doesn't exist
        profile = new Profile({
          user: user._id,
          bio: "Signed up with Google",
          image: profilePicture
            ? {
                url: profilePicture,
                public_id: "google_profile",
              }
            : undefined,
        });
        await profile.save();
      } else if (profilePicture && !profile.image) {
        // Update profile with Google picture if it doesn't have one
        profile.image = {
          url: profilePicture,
          public_id: "google_profile",
        };
        await profile.save();
      }
    }

    // Generate JWT token (same as regular login)
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      msg: isNewUser ? "Account created successfully" : "Login successful",
      token: token,
      user: {
        _id: user._id,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        phone: user.phone,
        isAdmin: user.isAdmin,
        isLivreur: user.isLivreur,
      },
      isNewUser: isNewUser,
    });
  } catch (err) {
    console.error("Google auth error:", err);
    res.status(500).json({
      success: false,
      msg: "Server error during Google authentication",
      error: err.message,
    });
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

module.exports = { register, login, googleAuth, getResetToken, reset };
