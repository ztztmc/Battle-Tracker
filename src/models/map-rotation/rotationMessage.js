const mongoose = require("mongoose");

const rotationMessageSchema = new mongoose.Schema({
  type: { type: String, required: true }, // 'map_pool'
  messageId: String,
  lastRotationText: String,
});

module.exports = mongoose.model("RotationMessage", rotationMessageSchema);
