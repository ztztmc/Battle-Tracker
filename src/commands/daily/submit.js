const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const axios = require("axios");
const PlayerSchema = require("../../models/player/player.js");
const DailyChallenge = require("../../models/player/dailyChallenge.js");
const GlobalData = require("../../models/globalData.js");

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
    .setName("submit")
    .setDescription(`Submit your game.`),

  async execute(interaction) {
    await interaction.deferReply();
    const today = new Date().toISOString().split("T")[0];
    const userId = interaction.user.id;
    let { currentMap } = await GlobalData.findOne({});
    if (!currentMap) {
      await interaction.editReply(
        `### ${process.env.ICON_MAP} **Could not find current map.**\n\nPlease try again later.`
      );
      return;
    }

    const registeredPlayer = await PlayerSchema.findOne({ userId });
    if (!registeredPlayer) {
      const notRegisteredEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription(
          `### ${process.env.ICON_BLOCK} **You are not registered**\n\nUse </register:1373217367433285705> in <#1375877348464791643>`
        );

      await interaction.editReply({
        embeds: [notRegisteredEmbed],
      });

      return;
    }

    const dailyChallenge = await DailyChallenge.findOne({
      userId: userId,
      date: today,
    });

    if (!dailyChallenge) {
      const existingChallengeEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription(
          `### ${process.env.ICON_BLOCK} **You have not joined today’s challenge**\n\nUse </join:1373213882663043124> first.`
        );

      await interaction.editReply({
        embeds: [existingChallengeEmbed],
      });

      return;
    }

    if (dailyChallenge.finishedToday) {
      const alreadySubmittedEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription(
          `### ${process.env.ICON_BLOCK} **You’ve already submitted your game for today**\n\nYour submitted time was \`${formattedTime}\`\nCome back tomorrow for more!`
        );

      await interaction.editReply({
        embeds: [alreadySubmittedEmbed],
      });

      return;
    }

    const uuid = registeredPlayer.minecraftUUID;
    const hypRes = await axios.get(
      `https://api.hypixel.net/player?key=${process.env.HYPIXEL_API_KEY}&uuid=${uuid}`
    );

    const hypRecentGamesRes = await axios.get(
      `https://api.hypixel.net/recentgames?key=${process.env.HYPIXEL_API_KEY}&uuid=${uuid}`
    );

    if (!hypRes.data.success || !hypRecentGamesRes.data.success) {
      const hypixelErrorEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription(
          `### ${process.env.ICON_BLOCK} **An unexpected error occured**\n\nThere was an error getting your information from the Hypixel API.\nPlease try again later.`
        );

      await interaction.editReply({
        embeds: [hypixelErrorEmbed],
      });

      return;
    }

    const stats = hypRes.data.player?.stats?.Bedwars;

    if (stats.games_played_bedwars == dailyChallenge.startGamesPlayed) {
      const noGamePlayedEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription(
          `### ${process.env.ICON_BLOCK} **You have not played a game**\n\nYou need to play at least 1 game to submit your time.`
        );

      await interaction.editReply({
        embeds: [noGamePlayedEmbed],
      });

      return;
    }

    if (stats.games_played_bedwars - dailyChallenge.startGamesPlayed !== 1) {
      dailyChallenge.finishedToday = true;
      dailyChallenge.disqualified = true;
      await dailyChallenge.save();
      const disqualifiedEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription(
          `### ${process.env.ICON_BLOCK} **You have been disqualified**\n\nYou played more than 1 game.\nYou can try again tomorrow!`
        );

      await interaction.editReply({
        embeds: [disqualifiedEmbed],
      });

      return;
    }

    const ongoingGame = hypRecentGamesRes.data.games.find(
      (game) =>
        game.gameType === "BEDWARS" &&
        game.mode === "BEDWARS_EIGHT_ONE" &&
        !game.ended
    );

    if (ongoingGame) {
      const ongoingGameEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription(
          `### ${process.env.ICON_BLOCK} **You have an ongoing game**\n\nPlease wait for your ongoing game on **${ongoingGame.map}** to finish before submitting.\nUse /games on hypixel to view your recent games.`
        );

      await interaction.editReply({
        embeds: [ongoingGameEmbed],
      });

      return;
    }

    const recentGames = hypRecentGamesRes.data.games;
    const lastGame = recentGames[0];

    if (
      lastGame.gameType !== "BEDWARS" ||
      lastGame.mode !== "BEDWARS_EIGHT_ONE"
    ) {
      dailyChallenge.finishedToday = true;
      dailyChallenge.disqualified = true;
      await dailyChallenge.save();

      const notCorrectGameEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription(
          `### ${process.env.ICON_BLOCK} **You have been disqualified**\n\nYour last completed game was not a Solo Bedwars game.\nYou can try again tomorrow!`
        );

      await interaction.editReply({
        embeds: [notCorrectGameEmbed],
      });

      return;
    }

    if (lastGame.map !== currentMap) {
      dailyChallenge.finishedToday = true;
      dailyChallenge.disqualified = true;
      await dailyChallenge.save();

      const notCorrectMapEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription(
          `### ${process.env.ICON_BLOCK} **You have been disqualified**\n\nYour game was not on the correct map.\nYou can try again tomorrow!\n\nMap required: **${currentMap}**\nMap Played: **${lastGame.map}**`
        );
      await interaction.editReply({
        embeds: [notCorrectMapEmbed],
      });
      return;
    }

    const finalKillsNew = stats.final_kills_bedwars || 0;
    const bedsBrokenNew = stats.beds_broken_bedwars || 0;
    const winsNew = stats.wins_bedwars || 0;
    let lostGame = false;

    let rawGameTime = lastGame.ended - lastGame.date;

    if (winsNew == dailyChallenge.startWins) {
      rawGameTime += 300000;
      lostGame = true;
    }

    rawGameTime -= (finalKillsNew - dailyChallenge.startFinalKills) * 5000;
    rawGameTime -= (bedsBrokenNew - dailyChallenge.startBedsBroken) * 5000;

    const formattedTime = convertMSToTime(rawGameTime);

    dailyChallenge.finishedToday = true;
    dailyChallenge.rawGameTime = rawGameTime;
    await dailyChallenge.save();

    const submittedEmbed = new EmbedBuilder()
      .setColor("Green")
      .setDescription(
        `### ${process.env.ICON_CHECK} **Time submitted: \`${formattedTime}\`**\n\nYou have completed today's challenge. Come back tomorrow for more!`
      );

    if (lostGame) {
      submittedEmbed.setFooter({
        text: "You lost the game, so 5 minutes have been added to your time",
      });
    }

    let sendPersonalBestEmbed = false;
    let personalBestEmbed;

    if (
      registeredPlayer.fastestGameTime != null &&
      rawGameTime < registeredPlayer.fastestGameTime
    ) {
      const oldPB = registeredPlayer.fastestGameTime;
      registeredPlayer.fastestGameTime = rawGameTime;
      personalBestEmbed = new EmbedBuilder()
        .setColor("Green")
        .setDescription(
          `### ${process.env.ICON_TROPHY} **New personal best!**\n\nYour new fastest game time is \`${formattedTime}\`\nYour previous personal best was \`${oldPB}\``
        );
      sendPersonalBestEmbed = true;
    }

    registeredPlayer.totalGamesSubmitted += 1;
    await registeredPlayer.save();

    if (!sendPersonalBestEmbed) {
      await interaction.editReply({
        embeds: [submittedEmbed],
      });
    } else {
      await interaction.editReply({
        embeds: [submittedEmbed, personalBestEmbed],
      });
    }
  },
};
