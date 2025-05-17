const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('submit')
    .setDescription('Submit your game for the daily BedWars challenge.'),

  async execute(interaction) {
    await interaction.deferReply();
    const userId = interaction.user.id;
    const username = interaction.user.username;

    // the a variable is used to cause an error to check if the error handling works
    await interaction.editReply(`${a}(testing submit command) \nUser ID: ${userId}\nUsername: ${username}\n`);
  }
};
