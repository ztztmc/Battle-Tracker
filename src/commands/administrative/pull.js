const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { exec } = require("child_process");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("pull")
    .setDescription("Pull latest changes from GitHub and restart the bot.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const ownerId = "490064167181746177";
    if (interaction.user.id !== ownerId) {
      return interaction.reply({
        content: "❌ You are not allowed to use this command.",
        ephemeral: true,
      });
    }

    await interaction.reply("🔄 Pulling latest updates from GitHub...");

    exec("git pull", (err, stdout, stderr) => {
      if (err) {
        console.error(err);
        return interaction.followUp(
          `❌ Git pull failed:\n\`\`\`\n${stderr || err.message}\n\`\`\``
        );
      }

      interaction.followUp(
        `✅ Git pulled successfully. \`nodemon\` should restart the bot if changes were made.\n\`\`\`\n${stdout}\n\`\`\``
      );
    });
  },
};
