const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const axios = require("axios");
const PlayerSchema = require("../../models/player/player.js");

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
    const existingPlayer = await PlayerSchema.findOne({ userId });

    if (existingPlayer) {
      const alreadyRegisteredEmbed = new EmbedBuilder()
        .setColor(0xff0000) // Red color
        .setDescription(
          `### ${process.env.ICON_BLOCK} **You are already registered**\n\nYou cannot register again. If you want to change your IGN, please tag an admin.`
        );

      await interaction.editReply({
        embeds: [alreadyRegisteredEmbed],
      });

      return;
    }
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
              `### ${process.env.ICON_BLOCK} **The username you entered does not exist**\n\nPlease re-check the ign: **${ign}**`
            );
          await interaction.editReply({
            embeds: [userDoesNotExistEmbed],
          });
          return;
        } else {
          const mojangErrorEmbed = new EmbedBuilder()
            .setColor(0xff0000) // Red color
            .setDescription(
              `### ${process.env.ICON_BLOCK} **An unexpected error occured**\n\nThere was an error connecting to the Mojang API. Please try again later.`
            );
          await interaction.editReply({
            embeds: [mojangErrorEmbed],
          });

          return;
        }
      }

      const correctIgn = uuidRes.data.name;

      const hypRes = await axios.get(
        `https://api.hypixel.net/player?key=${process.env.HYPIXEL_API_KEY}&uuid=${uuid}`
      );
      if (!hypRes.data.success) {
        const hypErrorEmbed = new EmbedBuilder()
          .setColor(0xff0000)
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

      if (hypDisc?.toLowerCase() === username.toLowerCase()) {
        const newPlayer = new PlayerSchema({
          discordId: userId,
          discordUsername: username,
          minecraftIGN: correctIgn,
          minecraftUUID: uuid,
        });
        await newPlayer.save().catch(async (err) => {
          console.error("Error saving new player:", err);
          const dbErrorEmbed = new EmbedBuilder()
            .setColor(0xff0000)
            .setDescription(
              `### ${process.env.ICON_BLOCK} **An unexpected error occured**\n\nWe were unable to register you due to a database error. Please try again later.`
            );
          await interaction.editReply({
            embeds: [dbErrorEmbed],
          });
        });

        await interaction.member.setNickname(`[0] ${correctIgn}`);

        const accountLinkedEmbed = new EmbedBuilder()
          .setColor("Green")
          .setDescription(
            `### ${process.env.ICON_CHECK} **You have been registered!**\n\nWelcome to **Battle Tracker**. Use </map:1374669634778959944> to see today's map and </join:1373213882663043124> to start!\nMore info in <#1277892888197599263>`
          );
        await interaction.editReply({
          embeds: [accountLinkedEmbed],
        });
        return;
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
