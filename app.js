var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var userRouter = require("./routes/userRoutes");
var authRouter = require("./routes/authRoutes");
var adminRouter = require("./routes/adminRoutes");

var app = express();

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

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  const error = req.app.get("env") === "development" ? err : {};

  // send JSON error response
  res.status(err.status || 500).json({
    message: err.message,
    error: error,
  });
});

module.exports = app;
