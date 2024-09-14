const mongoose = require("mongoose");

const globalDataSchema = new mongoose.Schema({
  serverId: { type: Number, require: true },
  map: { type: String, require: true },
});

const model = mongoose.model("globaldata", globalDataSchema);

module.exports = model;
