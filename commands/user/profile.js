const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('View your Battle Tracker profile.'),

  async execute(interaction) {
    await interaction.deferReply();
    const userId = interaction.user.id;
    const username = interaction.user.username;

    await interaction.editReply(`(testing profile command) \nUser ID: ${userId}\nUsername: ${username}\n`);
  }
};
