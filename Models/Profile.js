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
  social:{
    
  }
});

module.exports = mongoose.model("Profile", ProfileSchema);
