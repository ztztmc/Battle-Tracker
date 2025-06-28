const mongoose = require("mongoose");

const dailyChallengeSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    discordUsername: { type: String, required: true },
    date: { type: String, required: true },
    startGamesPlayed: Number,
    startFinalKills: Number,
    startBedsBroken: Number,
    startWins: Number,

    disqualified: { type: Boolean, default: false },
    finishedToday: { type: Boolean, default: false },

    rawGameTime: { type: Number, default: 0 },
  },
  { timestamps: true }
);

dailyChallengeSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("DailyChallenge", dailyChallengeSchema);
