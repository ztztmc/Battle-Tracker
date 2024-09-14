const mongoose = require("mongoose");

const playerScoreSchema = new mongoose.Schema({
  userId: { type: String, require: true, unique: true },
  ign: { type: String, require: true, unique: true },
  gameTime: { type: Number, default: 0 },
  fastestGameTime: { type: Number, default: 0 },
  gamesSubmitted: { type: Number, default: 0 },
  points: { type: Number, default: 0 },
});

const model = mongoose.model("playerscore", playerScoreSchema);

module.exports = model;
