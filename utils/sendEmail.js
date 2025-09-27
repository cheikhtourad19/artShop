const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // TLS
  auth: {
    user: "elghothvadel@gmail.com",
    pass: "cpco wdgk kknt qaxq", // without spaces
  },
});

module.exports = transporter;
