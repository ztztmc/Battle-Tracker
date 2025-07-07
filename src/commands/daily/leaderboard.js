const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const dailyChallenge = require("../../models/player/dailyChallenge");
const player = require("../../models/player/player");

function convertMSToTime(millisec) {
  var seconds = (millisec / 1000).toFixed(0);
  var minutes = Math.floor(seconds / 60);
  var hours = "";
  if (minutes > 59) {
    hours = Math.floor(minutes / 60);
    hours = hours >= 10 ? hours : "0" + hours;
    minutes = minutes - hours * 60;
    minutes = minutes >= 10 ? minutes : "0" + minutes;
  }

  seconds = Math.floor(seconds % 60);
  seconds = seconds >= 10 ? seconds : "0" + seconds;
  if (hours != "") {
    return hours + ":" + minutes + ":" + seconds;
  }
  return minutes + ":" + seconds;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("View the current standings for today."),

  async execute(interaction) {
    await interaction.deferReply();

    const entries = await dailyChallenge
      .find({ finishedToday: true })
      .sort({ rawGameTime: 1 })
      .catch((err) => console.log(err));

    const topFive = entries.slice(0, 5);

    if (topFive.length === 0) {
      const noEntriesEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription(
          `### ${process.env.ICON_BLOCK} **No entries found**\n\nNo games have been submitted today. You could be the first to submit!`
        );

      await interaction.editReply({
        embeds: [noEntriesEmbed],
      });

      return;
    }

    let desc = "";
    let removentryWithoutGameTime = 0;
    for (let i = 0; i < topFive.length; i++) {
      if (!topFive[i].rawGameTime) {
        removentryWithoutGameTime++;
        continue;
      }
      let { user } = await interaction.guild.members.fetch(topFive[i].userId);
      if (!user) {
        console.log("Index " + i + " was omitted due to not having an userId");
        return;
      }
      let playerData = await player.findOne({
        userId: user.id,
      });
      if (!playerData) {
        console.log(
          "Index " + i + " was omitted due to not having dailyChallenge data"
        );
        return;
      }
      const { minecraftIGN } = playerData;
      let userGameTime = convertMSToTime(topFive[i].rawGameTime);
      desc +=
        "#" +
        (i + 1 - removentryWithoutGameTime) +
        " **" +
        minecraftIGN +
        "** • " +
        userGameTime +
        "\n";
    }
    if (desc == "") {
      desc = "No games to display yet.";
    }
    if (entries.length > 4) {
      const entrycount = entries.length + 1;
      desc += "\nGames Submitted Today: " + entrycount;
    }

    const leaderboardEmbed = new EmbedBuilder()
      .setColor("Green")
      .setDescription(`### 🏆 **Daily Leaderboard**\n\n${desc}`);

    await interaction.editReply({
      embeds: [leaderboardEmbed],
    });
  },
};
