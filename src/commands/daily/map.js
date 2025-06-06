const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("map")
    .setDescription(`View today's map.`),

  async execute(interaction) {
    await interaction.deferReply();
    const userId = interaction.user.id;
    const username = interaction.user.username;

    await interaction.editReply(
      `(testing map command) \nUser ID: ${userId}\nUsername: ${username}\n`
    );
  },
};
