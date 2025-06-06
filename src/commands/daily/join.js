const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("join")
    .setDescription(`Join today's Bedwars challenge.`),

  async execute(interaction) {
    await interaction.deferReply();
    const userId = interaction.user.id;
    const username = interaction.user.username;
    const mapName = "Slumber";

    const startedEmbed = new EmbedBuilder()
      .setColor("Green")
      .setDescription(
        `### ${process.env.ICON_CHECK} **You have joined today's challenge!**\n\nPlay **1** game of Bedwars on the map ${mapName} and use </submit:1373216244169441321>`
      );

    await interaction.editReply({
      embeds: [startedEmbed],
    });
  },
};
