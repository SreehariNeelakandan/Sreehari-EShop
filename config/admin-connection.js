require("dotenv").config();

module.exports = {
  adminId: {
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASS,
  },
};
