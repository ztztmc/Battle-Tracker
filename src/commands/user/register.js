const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const axios = require("axios");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("register")
    .setDescription("Register to Battle Tracker.")
    .addStringOption((option) =>
      option
        .setName("ign")
        .setDescription("Your Minecraft IGN")
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply();
    const userId = interaction.user.id;
    const username = interaction.user.username;
    const ign = interaction.options.getString("ign");

    if (interaction.channelId == "1375877348464791643") {
      let uuid;
      let uuidRes;
      try {
        uuidRes = await axios.get(
          `https://api.mojang.com/users/profiles/minecraft/${ign}`
        );
        uuid = uuidRes.data.id;
      } catch (err) {
        if (err.response && err.response.status === 404) {
          console.log("couldn't find ign:", ign);
          const userDoesNotExistEmbed = new EmbedBuilder()
            .setColor(0xff0000) // Red color
            .setDescription(
              `### ${process.env.ICON_BLOCK} **The username you entered does not exist.**\n\nPlease re-check the ign: **${ign}**`
            );
          await interaction.editReply({
            embeds: [userDoesNotExistEmbed],
          });
          return;
        } else {
          const mojangErrorEmbed = new EmbedBuilder()
            .setColor(0xff0000) // Red color
            .setDescription(
              `### ${process.env.ICON_BLOCK} **An error occured.**\n\nThere was a problem connecting to the Mojang API. Please try again later.`
            );
          await interaction.editReply({
            embeds: [mojangErrorEmbed],
          });
        }
      }

      const correctIgn = uuidRes.data.name;

      const hypRes = await axios.get(
        `https://api.hypixel.net/player?key=${process.env.HYPIXEL_API_KEY}&uuid=${uuid}`
      );
      if (!hypRes.data.success) {
        const hypErrorEmbed = new EmbedBuilder()
          .setColor(0xff0000) // Red color
          .setDescription(
            `### ${process.env.ICON_BLOCK} **An unexpected error occured**\n\nThere was an error getting your information from the Hypixel API.`
          )
          .setFooter({
            text: "This error has been reported. Please try again later.",
          });
        await interaction.editReply({
          embeds: [hypErrorEmbed],
        });
        return;
      }
      const hypDisc = hypRes.data.player.socialMedia.links.DISCORD;

      //if their discord does not match the discord in their hypixel account
      if (hypDisc?.toLowerCase() === username.toLowerCase()) {
        const accountLinkedEmbed = new EmbedBuilder()
          .setColor("Green")
          .setDescription(
            `### ${process.env.ICON_CHECK} **You have been registered!**\nWelcome to **Battle Tracker**. Use </map:1374669634778959944> to see today's map and </join:1373213882663043124> to start!\nMore info in <#1277892888197599263>`
          );
      } else {
        const hypDiscNotMatchEmbed = new EmbedBuilder()
          .setColor(0xff0000) // Red color
          .setDescription(
            `### ${process.env.ICON_BLOCK} **Hypixel Discord mismatch**\n\nYour Discord account does not match the Discord account linked to Hypixel.\nLink your Discord account to Hypixel if it's not already linked.`
          );
        await interaction.editReply({
          embeds: [hypDiscNotMatchEmbed],
        });
        return;
      }
      await interaction.editReply(
        `register test\nyour disc: ${username} ign u entered: ${ign} mojang ign: ${correctIgn} disc in hyp: ${hypDisc} match: ${
          hypDisc?.toLowerCase() === username.toLowerCase()
        }`
      );
    } else {
      const wrongChannelEmbed = new EmbedBuilder()
        .setColor(0xff0000) // Red color
        .setDescription(
          `### ${process.env.ICON_BLOCK} **You cannot register here!**\n\nUse </register:1373217367433285705> in <#1375877348464791643>`
        );
      await interaction.editReply({
        embeds: [wrongChannelEmbed],
      });
    }
  },
};
