const mongoose = require("mongoose");

const globalDataSchema = new mongoose.Schema(
  {
    currentMap: { type: String, required: true },
    date: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("GlobalData", globalDataSchema);
