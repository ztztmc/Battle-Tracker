const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const axios = require("axios");
const PlayerSchema = require("../../models/player/player.js");
const DailyChallenge = require("../../models/player/dailyChallenge.js");
const GlobalData = require("../../models/globalData.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("join")
    .setDescription(`Join today's Bedwars challenge.`),

  async execute(interaction) {
    await interaction.deferReply();
    const today = new Date().toISOString().split("T")[0];
    const userId = interaction.user.id;
    const username = interaction.user.username;
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

    const existingChallenge = await DailyChallenge.findOne({
      userId,
    });
    if (existingChallenge) {
      const existingChallengeEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription(
          `### ${process.env.ICON_BLOCK} **You’ve already joined today’s challenge**\n\nComplete your game on **${currentMap}** and use </submit:1373216244169441321> when ready`
        );

      await interaction.editReply({
        embeds: [existingChallengeEmbed],
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
          `### ${process.env.ICON_BLOCK} **You have an ongoing game**\n\nPlease wait for your ongoing game on **${ongoingGame.map}** to finish before joining a new challenge.\nUse \`/games\` on hypixel to view your recent games.`
        );

      await interaction.editReply({
        embeds: [ongoingGameEmbed],
      });

      return;
    }

    const stats = hypRes.data.player?.stats?.Bedwars;
    const newChallenge = new DailyChallenge({
      userId,
      discordUsername: username,
      date: today,
      startGamesPlayed: stats.games_played_bedwars || 0,
      startFinalKills: stats.final_kills_bedwars || 0,
      startBedsBroken: stats.beds_broken_bedwars || 0,
      startWins: stats.wins_bedwars || 0,
    });

    await newChallenge.save();

    const startedEmbed = new EmbedBuilder()
      .setColor("Green")
      .setDescription(
        `### ${process.env.ICON_CHECK} **You have joined today's challenge!**\n\nPlay **1** game of **Solo** Bedwars on the map **${currentMap}** then use </submit:1373216244169441321>`
      );

    await interaction.editReply({
      embeds: [startedEmbed],
    });
  },
};
