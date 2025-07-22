const { SlashCommandBuilder } = require("discord.js");
const GlobalData = require("../../models/globalData.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("map")
    .setDescription(`View today's map.`),

  async execute(interaction) {
    await interaction.deferReply();

    let { currentMap } = await GlobalData.findOne({});
    if (!currentMap) {
      await interaction.editReply(
        `### ${process.env.ICON_MAP} **Could not find current map.**\n\nPlease try again later.`
      );
      return;
    }

    await interaction.editReply(
      `### ${process.env.ICON_MAP} **Today's Map: ** \`${currentMap}\``
    );
  },
};
