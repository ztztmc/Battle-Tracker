const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('join')
    .setDescription('Join the daily BedWars challenge.'),

  async execute(interaction) {
    await interaction.deferReply();
    const userId = interaction.user.id;
    const username = interaction.user.username;

    await interaction.editReply(`(testing join command) \nUser ID: ${userId}\nUsername: ${username}\n`);
  }
};
