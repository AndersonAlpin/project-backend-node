const mongoose = require("../database/mongoose");
const { Schema } = require("mongoose");

const GameSchema = new Schema({}, { strict: false });
const Game = mongoose.model("Game", GameSchema);

module.exports = Game;