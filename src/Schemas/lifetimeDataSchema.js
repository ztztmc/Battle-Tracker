const mongoose = require("mongoose");

const lifetimeDataSchema = new mongoose.Schema({
  userId: { type: Number, require: true, unique: true },
  ign: { type: String, require: true },
  fastestGameTime: { type: String },
  gamesSubmitted: { type: Number },
});

const model = mongoose.model("lifetimedata", lifetimeDataSchema);

module.exports = model;
