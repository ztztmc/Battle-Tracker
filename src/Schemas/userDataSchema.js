const mongoose = require("mongoose");

const userDataSchema = new mongoose.Schema({
  userId: { type: String, require: true, unique: true },
  ign: { type: String, require: true, unique: true },
  startGamesPlayed: { type: Number },
  startFinalKills: { type: Number },
  startBedsBroken: { type: Number },
  startWins: { type: Number },
  finalGameTime: { type: Number },
  points: { type: Number },
  finishedToday: { type: Boolean },
  disqualified: { type: Boolean, default: false },
});

const model = mongoose.model("userdata", userDataSchema);

module.exports = model;
