require("dotenv").config();
const { CronJob } = require("cron");
const { EmbedBuilder } = require("discord.js");
const player = require("../models/player/player.js");
const dailyChallenge = require("../models/player/dailyChallenge.js");
const GlobalData = require("../models/globalData.js");
const CurrentPool = require("../models/map-rotation/currentPool");

async function startDailyResetCron(client) {
  const job = new CronJob(
    "0 9 * * *", // 9:00 AM
    async () => {
      const entries = await dailyChallenge
        .find({ finishedToday: true })
        .sort({ rawGameTime: 1 })
        .catch((err) => console.error(err));

      const topFive = entries.slice(0, 5);

      if (topFive.length === 0) {
        console.log("No entries to process.");
        process.exit(0);
      }

      let desc = "";
      const pointRewards = [5, 4, 3, 2, 1]; // For positions 1–5

      for (let i = 0; i < topFive.length; i++) {
        const entry = topFive[i];
        const userId = entry.userId;
        const pointsToAdd = pointRewards[i] || 0;

        const playerData = await player.findOne({ userId });
        if (!playerData) continue;

        // Add points to the player
        playerData.points = (playerData.points || 0) + pointsToAdd;
        await playerData.save();

        const ign = playerData.minecraftIGN || "Unknown";
        desc += `#${i + 1} **${ign}** • +${pointsToAdd} points\n`;
      }

      const poolDoc = await CurrentPool.findOne();
      const mapPool = poolDoc?.maps || [];

      let nextMap = "Unknown";
      if (mapPool.length > 0) {
        nextMap = mapPool[Math.floor(Math.random() * mapPool.length)];
        await GlobalData.findOneAndUpdate(
          {},
          { currentMap: nextMap },
          { upsert: true }
        );
      }

      // Send to channel
      const channel = await client.channels.fetch(
        process.env.SCORES_CHANNEL_ID
      );
      if (channel) {
        const embed = new EmbedBuilder()
          .setColor("Green")
          .setTitle("🎯 Daily Challenge Results")
          .setDescription(
            `${desc}\n\n${process.env.ICON_MAP} **Next Map:** \`${nextMap}\``
          )
          .setFooter({ text: "Scores reset. Good luck today!" });

        await channel.send({ embeds: [embed] });
        await dailyChallenge.deleteMany({});
      } else {
        console.log("Could not find scores channel.");
      }
    },
    null,
    true,
    "America/New_York"
  );
  job.start();
}

module.exports = { startDailyResetCron };
