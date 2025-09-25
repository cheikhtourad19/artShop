const jwt = require("jsonwebtoken");
const User = require("../Models/User");

const admin = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ msg: "No token, authorization denied" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
    if (!req.user.isAdmin || !req.user) {
      return res.status(403).json({ msg: "Admin resource. Access denied." });
    }
    next();
  } catch (err) {
    return res.status(401).json({ msg: "Token is not valid" });
  }
};

module.exports = { admin };
