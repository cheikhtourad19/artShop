// models/Product.js
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    artisan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true }, // peut être généré
    description: { type: String, required: true }, // générée par IA
    price: { type: Number, required: true },
    images: [
      {
        url: String,
        public_id: String, // For Cloudinary
      },
    ], // chemin ou URL
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
