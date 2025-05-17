const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('View the current standings for today.'),

  async execute(interaction) {
    await interaction.deferReply();
    const userId = interaction.user.id;
    const username = interaction.user.username;

    await interaction.editReply(`(testing leaderboard command) \nUser ID: ${userId}\nUsername: ${username}\n`);
  }
};
