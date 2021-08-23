const mongoose = require("../database/mongoose");

const User = mongoose.Schema({
  user_hash: String,
});

module.exports = mongoose.model("User", User);
