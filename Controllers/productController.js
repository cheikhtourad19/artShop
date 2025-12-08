const User = require("../Models/User");
const Profile = require("../Models/Profile");
const Product = require("../Models/Product");
const transporter = require("../utils/sendEmail");
const { cloudinary } = require("../config/cloudinary");
require("dotenv").config();
async function addProduct(req, res) {
  console.log("Request body:", req.body);
  try {
    const { title, description, price, categories, dimensions } = req.body;
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

    // Parse categories from JSON string
    let categoryArray = [];
    if (categories) {
      try {
        categoryArray =
          typeof categories === "string" ? JSON.parse(categories) : categories;

        // Ensure it's an array
        if (!Array.isArray(categoryArray)) {
          categoryArray = [categoryArray];
        }
      } catch (parseError) {
        console.error("Error parsing categories:", parseError);
        // If parsing fails, treat as single category
        categoryArray = [categories];
      }
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
      dimensions,
      category: categoryArray, // Use the parsed array
    });

    await product.save();

    console.log("Product saved with categories:", product.category);

    res.status(201).json({
      success: true,
      message: "Product added successfully",
      product: {
        _id: product._id,
        title: product.title,
        category: product.category,
      },
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
async function sendEmail(req, res) {
  try {
    const { email, subject, message } = req.body;
    await transporter.sendMail({
      from: `"Support" <${process.env.EMAIL_USER}>`,
      to: "elghothvadel@gmail.com",
      subject: subject,
      html: `
        <p>Bonjour Admin,</p>
        <p>Vous venez de recevoir un feedback de ${email}</p>
        <p>Message:</p>
        <p>${message}</p>
        <br/>
        <p>Cordialement,</p>
        <p>Votre équipe de support</p>
      `,
    });
    res.status(200).json({
      success: true,
      message: "Email sent successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}
async function editProduct(req, res) {
  try {
    const { id } = req.params;
    const { title, description, price, promo, category, dimensions } = req.body;
    console.log(req.body);
    const user = req.user;

    const product = await Product.findById(id);
    if (user.isAdmin || product.artisan.equals(user._id)) {
      let updatedObject = {
        title,
        description,
        price,
        promo,
      };

      // Add categories if provided
      if (category && category.length > 0) {
        updatedObject.category = category; // Changed to 'categories'
      }

      // Add dimensions if provided and not empty
      if (dimensions && dimensions.trim() !== "") {
        updatedObject.dimensions = dimensions;
      }

      await Product.findByIdAndUpdate(id, updatedObject);

      res.status(200).json({
        success: true,
        message: "Product updated successfully",
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
      message: error.message, // Changed to error.message for better error handling
    });
  }
}
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
async function getFilteredProducts(req, res) {
  try {
    const { minPrice, maxPrice, category, date, withPromo } = req.query;

    const filter = {};

    // Price filter
    if (minPrice) filter.price = { ...filter.price, $gte: Number(minPrice) };
    if (maxPrice) filter.price = { ...filter.price, $lte: Number(maxPrice) };

    // Category filter - now category is an array
    if (category) {
      filter.category = { $in: [category] }; // Check if category array contains the specified category
    }

    // Promo filter - check if promo exists and is > 0
    if (withPromo === "true") {
      filter.promo = { $exists: true, $ne: null, $gt: 0 };
    }

    // Date sorting
    let sortBy = { createdAt: -1 }; // default: le plus récent
    if (date === "dsc") sortBy = { createdAt: -1 }; // le plus récent
    if (date === "asc") sortBy = { createdAt: 1 }; // le plus ancien

    // Price sorting option
    if (req.query.sort === "price-asc") {
      sortBy = { price: 1 };
    } else if (req.query.sort === "price-desc") {
      sortBy = { price: -1 };
    }

    const products = await Product.find(filter).sort(sortBy);

    res.json({ success: true, products });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
}

async function getProduct(req, res) {
  try {
    const id = req.params.id;
    const product = await Product.findById(id);
    const artisan = await User.findById(product.artisan);
    const bio = await Profile.findOne({ user: artisan._id });
    res.json({ success: true, product: product, artisan: artisan, bio: bio });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
async function getProducts(req, res) {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json({ success: true, products: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
async function getProductByUser(req, res) {
  try {
    const id = req.params.id;
    const products = await Product.find({ artisan: id }).sort({
      createdAt: -1,
    });
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
  sendEmail,
  getFilteredProducts,
};
