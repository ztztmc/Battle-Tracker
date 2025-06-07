const mongoose = require("mongoose");

const dailyChallengeSchema = new mongoose.Schema(
  {
    discordId: { type: String, required: true },
    date: { type: String, required: true },
    startGamesPlayed: Number,
    startFinalKills: Number,
    startBedsBroken: Number,
    startWins: Number,

    disqualified: { type: Boolean, default: false },
    finishedToday: { type: Boolean, default: false },

    rawGameTime: Number,
  },
  { timestamps: true }
);

dailyChallengeSchema.index({ discordId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("DailyChallenge", dailyChallengeSchema);
