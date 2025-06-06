const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("submit")
    .setDescription(`Submit your game.`),

  async execute(interaction) {
    await interaction.deferReply();
    const userId = interaction.user.id;
    const username = interaction.user.username;
    const formattedTime = "3:23";

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
