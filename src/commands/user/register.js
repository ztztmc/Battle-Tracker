const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

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

    if(interaction.channelId == "1375877348464791643") {
      const uuidRes = await axios.get(`https://api.mojang.com/users/profiles/minecraft/${ign}`);
      if(uuidRes.data.errorMessage) {
        const userDoesNotExistEmbed = new EmbedBuilder()
          .setColor(0xff0000) // Red color
          .setDescription(`### ${process.env.ICON_BLOCK} **The username you entered does not exist.**\n\nPlease re-check the ign: ${ign}\``)
        await interaction.editReply({
          embeds: [userDoesNotExistEmbed],
        });
        return;
      }
      const correctIgn = uuidRes.data.name;
      const uuid = uuidRes.data.id;

      const hypRes = await axios.get(`https://api.hypixel.net/player?key=${process.env.HYPIXEL_API_KEY}&uuid=${uuid}`);
      if(!hypRes.data.success) {
        const hypErrorEmbed = new EmbedBuilder()
          .setColor(0xff0000) // Red color
          .setDescription(`### ${process.env.ICON_BLOCK} **An unexpected error occured.!**\n\nThere was an error getting your information from the Hypixel API.`)
          .setFooter({ text: 'This error has been reported. Please try again later.' });
        await interaction.editReply({
          embeds: [hypErrorEmbed],
        });
        return;
      }
      const hypDisc = hypRes.data.player.socialMedia.links.DISCORD;
      await interaction.editReply(`register test\nyour disc: ${username} ign u entered: ${ign} mojang ign: ${correctIgn} disc in hyp: ${hypDisc} match: ${correctIgn == hypDisc}`);
    } else {
      const wrongChannelEmbed = new EmbedBuilder()
        .setColor(0xff0000) // Red color
        .setDescription(`### ${process.env.ICON_BLOCK} **You cannot register here!**\n\nUse </register:1373217367433285705> in <#1375877348464791643>`)
      await interaction.editReply({
        embeds: [wrongChannelEmbed],
      });
    }
  }
};
