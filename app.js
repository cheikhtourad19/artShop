var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cors = require("cors");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var userRouter = require("./routes/userRoutes");
var authRouter = require("./routes/authRoutes");
var adminRouter = require("./routes/adminRoutes");
var productController = require("./routes/productRoutes");
var aiRouter = require("./routes/aiRoutes");
var livreruRouter = require("./routes/livreurRoutes");

var app = express();

// ✅ Apply cors BEFORE routes
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Middleware setup
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/admin", adminRouter);
app.use("/api/products", productController);
app.use("/api/ai", aiRouter);
app.use("/api/livreur", livreruRouter);
// catch 404
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  const error = req.app.get("env") === "development" ? err : {};

  res.status(err.status || 500).json({
    message: err.message,
    error: error,
  });
});

module.exports = app;
