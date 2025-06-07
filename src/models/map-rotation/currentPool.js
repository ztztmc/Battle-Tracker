const mongoose = require("mongoose");

const currentPoolSchema = new mongoose.Schema({
  maps: [String],
});

module.exports = mongoose.model("CurrentPool", currentPoolSchema);
