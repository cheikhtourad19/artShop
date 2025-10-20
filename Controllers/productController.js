const User = require("../Models/User");
const Product = require("../Models/Product");
const { cloudinary } = require("../config/cloudinary");
require("dotenv").config();
async function addProduct(req, res) {
  try {
    const { title, description, price } = req.body;
    const user = req.user._id;

    // Validate required fields
    if (!user || !title || !description || !price) {
      // Clean up uploaded images if validation fails
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          await cloudinary.uploader.destroy(file.filename);
        }
      }
      return res.status(400).json({
        success: false,
        message: "Artisan, title, description, and price are required fields",
      });
    }

    if (isNaN(price) || parseFloat(price) <= 0) {
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          await cloudinary.uploader.destroy(file.filename);
        }
      }
      return res.status(400).json({
        success: false,
        message: "Price must be a valid positive number",
      });
    }

    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map((file) => ({
        url: file.path,
        public_id: file.filename,
      }));
    }

    const product = new Product({
      artisan: user,
      title: title.trim(),
      description: description.trim(),
      price: parseFloat(price),
      images,
    });

    await product.save();
    res.status(201).json({
      success: true,
      message: "Product added successfully",
    });
  } catch (error) {
    console.error("Error adding product:", error);

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          await cloudinary.uploader.destroy(file.filename);
        } catch (cleanupError) {
          console.error("Error cleaning up image:", cleanupError);
        }
      }
    }
    res.status(500).json({
      success: false,
      message: "Error adding product",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
}
async function editProduct(req, res) {}
async function deleteProduct(req, res) {
  try {
    const { id } = req.params;
    const user = req.user;
    const product = await Product.findById(id);

    if (user.isAdmin || product.artisan.equals(user._id)) {
      await Product.findByIdAndDelete(id);
      res.status(200).json({
        success: true,
        message: "Product deleted successfully",
      });
    } else {
      res.status(403).json({
        success: false,
        message: "vous n avez pas l'acces",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur de Serveur",
    });
  }
}
async function getProducts(req, res) {
  try {
    const products = await Product.find();
    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
async function getProduct(req, res) {
  try {
    const id = req.params.id;
    const product = await Product.findById(id);
    const artisan = await User.findById(product.artisan);
    res.json({ success: true, product: product, artisan: artisan });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
async function getProductByUser(req, res) {
  try {
    const id = req.params.id;
    const products = await Product.find({ artisan: id });
    res.json({ success: true, products: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
module.exports = {
  addProduct,
  editProduct,
  deleteProduct,
  getProduct,
  getProducts,
  getProductByUser,
};
