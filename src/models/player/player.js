const mongoose = require("mongoose");

const playerSchema = new mongoose.Schema(
  {
    discordId: { type: String, required: true, unique: true },
    discordUsername: { type: String, required: true },
    minecraftIGN: { type: String, required: true },
    minecraftUUID: { type: String, required: true },
    points: { type: Number, default: 0 },
    rank: { type: Number, default: -1 },
    fastestGameTime: { type: Number, default: null },
    totalGamesSubmitted: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Player", playerSchema);
