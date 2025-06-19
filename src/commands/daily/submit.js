const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const axios = require("axios");
const PlayerSchema = require("../../models/player/player.js");
const DailyChallenge = require("../../models/player/dailyChallenge.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("submit")
    .setDescription(`Submit your game.`),

  async execute(interaction) {
    await interaction.deferReply();
    const today = new Date().toISOString().split("T")[0];
    const userId = interaction.user.id;
    const username = interaction.user.username;

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

    const formattedTime = "3:23"; // Placeholder for the actual game time

    if (dailyChallenge.finishedToday) {
      const alreadySubmittedEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription(
          `### ${process.env.ICON_BLOCK} **You’ve already submitted your game for today**\n\nYour submitted time was \`\`\`${formattedTime}\`\`\`\nCome back tomorrow for more!`
        );

      await interaction.editReply({
        embeds: [alreadySubmittedEmbed],
      });

      return;
    }

    const submittedEmbed = new EmbedBuilder()
      .setColor("Green")
      .setDescription(
        `### ${process.env.ICON_CHECK} **Time submitted: ${formattedTime}**\n\nYou have completed today's challenge. Come back tomorrow for more!`
      );

    await interaction.editReply({
      embeds: [submittedEmbed],
    });
  },
};
