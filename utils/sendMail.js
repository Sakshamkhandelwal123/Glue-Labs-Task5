require("dotenv").config();
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SENDER_EMAIL, //put your mail here
    pass: process.env.SENDER_PASSWORD, //password here
  },
});

module.exports = {
  transporter,
};
