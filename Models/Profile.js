const mongoose = require("mongoose");

const ProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  bio: { type: String, default: "" },
  image: {
    url: String,
    public_id: String,
  },
  social: {
    facebook: { type: String, default: "" },
    tiktok: { type: String, default: "" },
    instagram: { type: String, default: "" },
  },
  location: {
    type: String,
    default: "",
  },
});

module.exports = mongoose.model("Profile", ProfileSchema);
