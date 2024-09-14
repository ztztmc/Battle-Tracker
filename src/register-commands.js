require("dotenv").config();
const { REST, Routes, ApplicationCommandOptionType } = require("discord.js");

const commands = [
  {
    name: "map",
    description: "Check what map is currently required",
    options: [
      {
        name: "map",
        description: "Enter the new map",
        type: ApplicationCommandOptionType.String,
      },
    ],
  },
  {
    name: "reset",
    description: "(Admin) Reset everyone's stats or a certain player's stats for the day",
    options: [
      {
        name: "ign",
        description: "Enter the ign of the player whose stats you want to reset",
        type: ApplicationCommandOptionType.String,
        require: true,
      },
    ],
  },
  {
    name: "start",
    description: "Join today's challenge",
    options: [
      {
        name: "ign",
        description: "Enter your minecraft username",
        type: ApplicationCommandOptionType.String,
      },
    ],
  },
  {
    name: "submit",
    description: "Submit your attempt",
  },
  {
    name: "profile",
    description: "Displays your profile",
    options: [
      {
        name: "type",
        description: "Choose the type of profile you want to see",
        type: ApplicationCommandOptionType.String,
        require: true,
        choices: [
          {
            name: "Season",
            value: "season",
          },
          {
            name: "Lifetime",
            value: "lifetime",
          },
          {
            name: "Daily",
            value: "daily",
          },
        ],
      },
      {
        name: "ign",
        description: "Enter the ign of the player whose profile you want to view",
        type: ApplicationCommandOptionType.String,
      },
    ],
  },
  {
    name: "recentgames",
    description: "View a player's most recent games.",
    options: [
      {
        name: "ign",
        description: "Enter ign of the player whose recent games you want to view",
        type: ApplicationCommandOptionType.String,
        require: true,
      },
    ],
  },
  {
    name: "bedwars",
    description: "View a player's bedwars stats.",
    options: [
      {
        name: "ign",
        description: "Enter ign of the player",
        type: ApplicationCommandOptionType.String,
        require: true,
      },
    ],
  },
  {
    name: "leaderboard",
    description: "View the current leaderboard",
    options: [
      {
        name: "type",
        description: "Choose the type of leaderboard you want to see",
        type: ApplicationCommandOptionType.String,
        require: true,
        choices: [
          {
            name: "Season",
            value: "season",
          },
          {
            name: "Daily",
            value: "daily",
          },
        ],
      },
    ],
  },
];

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log("Registering slash commands...");

    await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), {
      body: commands,
    });

    console.log("✅ Slash commands were registered successfully!");
  } catch (e) {
    console.log(`Error occurred while registering slash commands :(\nError: ${e}`);
  }
})();
