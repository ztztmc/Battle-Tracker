require('dotenv').config();
const { Client, GatewayIntentBits, Events, Collection, EmbedBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const mongoose = require("mongoose");
const { startRotationCron } = require("./other/updateRotation.js");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

client.commands = new Collection();

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.log(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`,
      );
    }
  }
}

client.once(Events.ClientReady, async readyClient => {
  console.log(`✅ Logged in as ${readyClient.user.tag}`);
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connected to MongoDB");

  startRotationCron(client);
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;
  const command = interaction.client.commands.get(interaction.commandName);
  if (!command) {
    console.error(
      `[ERROR] No command matching ${interaction.commandName} was found.`,
    );
    return;
  }
  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(
      `[ERROR] Error executing command ${interaction.commandName}:`,
      error,
    );

    const errorEmbed = new EmbedBuilder()
      .setColor(0xff0000) // Red color
      .setTitle(`There was an error while executing the /${interaction.commandName} command!`)
      .setTimestamp()
      .setFooter({ text: 'This error has been reported. Please try again later.' });

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        embeds: [errorEmbed],
      });
    } else {
      await interaction.reply({
        embeds: [errorEmbed],
      });
    }

    // Send the error details to the errors channel
    const errorsChannelId = '1290353892806361273'; // Replace with your channel ID
    const errorsChannel = client.channels.cache.get(errorsChannelId);

    if (errorsChannel) {
      const errorEmbed = new EmbedBuilder()
        .setColor(0xff0000) // Red color
        .setTitle('Command Error Report')
        .setDescription(`An error occurred while executing a command.`)
        .addFields(
          { name: 'User', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
          { name: 'Command', value: `/${interaction.commandName}`, inline: true },
          { name: 'Error', value: `\`\`\`${error}\`\`\`` },
        )
        .setTimestamp();

      await errorsChannel.send({ embeds: [errorEmbed] });
    } else {
      console.error(`[ERROR] Admin channel with ID ${errorsChannelId} not found.`);
    }

    }
  }
);

client.login(process.env.DISCORD_TOKEN);
