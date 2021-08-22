const mongoose = require("../database/mongoose");

const User = mongoose.Schema({
  email: String,
  password: String,
});

module.exports = mongoose.model("User", User);
