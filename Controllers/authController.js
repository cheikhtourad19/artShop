const User = require("../Models/User");
const jwt = require("jsonwebtoken");
const validator = require("validator");

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

module.exports = { register, login };
