const { SlashCommandBuilder } = require("discord.js");
const axios = require("axios");
const PlayerSchema = require("../../models/player/player.js");
const DailyChallenge = require("../../models/DailyChallenge");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("join")
    .setDescription(`Join today's Bedwars challenge.`),

  async execute(interaction) {
    await interaction.deferReply();
    const today = new Date().toISOString().split("T")[0];
    const userId = interaction.user.id;
    const username = interaction.user.username;
    const mapName = "Slumber";

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
      discordId,
      date: today,
    });
    if (existingChallenge) {
      const existingChallengeEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription(
          `### ${process.env.ICON_BLOCK} **You’ve already joined today’s challenge**\n\nComplete your game on ${mapName} and use </submit:1373216244169441321> when ready`
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

    if (!hypRes.data.success) {
      const hypixelErrorEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription(
          `### ${process.env.ICON_BLOCK} **An unexpected error occured**\n\nnThere was an error getting your information from the Hypixel API.`
        );

      await interaction.editReply({
        embeds: [hypixelErrorEmbed],
      });

      return;
    }

    const stats = hypRes.data.player?.stats?.Bedwars;
    const newChallenge = new DailyChallenge({
      discordId,
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
        `### ${process.env.ICON_CHECK} **You have joined today's challenge!**\n\nPlay **1** game of **Solo** Bedwars on the map ${mapName} and use </submit:1373216244169441321>`
      );

    await interaction.editReply({
      embeds: [startedEmbed],
    });
  },
};
