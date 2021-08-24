const mongoose = require("mongoose");
const { Schema } = require("mongoose");

mongoose.connect(process.env.URI_MONGODB, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const UserSchema = new Schema({ user_hash: String });
const GameSchema = new Schema({}, { strict: false });

const Game = mongoose.model("Game", GameSchema);
const User = mongoose.model("User", UserSchema);

module.exports = { Game, User };
