const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('register')
    .setDescription('Register to Battle Tracker.')
    .addStringOption(option =>
        option.setName('ign').setDescription('Your Minecraft IGN').setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply();
    const userId = interaction.user.id;
    const username = interaction.user.username;
    const ign = interaction.options.getString('ign');

    await interaction.editReply(`(testing register command) \nUser ID: ${userId}\nUsername: ${username}\n IGN: ${ign}\n`);
  }
};
