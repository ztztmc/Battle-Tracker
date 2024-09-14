require("dotenv").config();
const {
  Client,
  IntentsBitField,
  PermissionsBitField,
  EmbedBuilder,
  ActivityType,
} = require("discord.js");
const axios = require("axios");
const mongoose = require("mongoose");
const userDataModel = require("../src/Schemas/userDataSchema.js");
const globalDataModel = require("../src/Schemas/globalDataSchema.js");
const playerScoreModel = require("../src/Schemas/playerScoreSchema.js");
var mapRequired = "None";
const mapsPossible = ["Arid", "Casita", "Hollow", "Vigilante", "Lightstone"];
var count30 = 0;

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
  ],
});

async function connectToDB() {
  try {
    await mongoose.connect(process.env.MONDODB_URL).then(() => {
      console.log("✅ Connected to the database! (2/2)");
    });
  } catch (e) {
    console.log("Error connecting to database :(\n" + e);
  }
}

function updateMemberCount(guild) {
  const channel = guild.channels.cache.get("1281965155374076034");
  channel.setName("🌎・" + guild.memberCount.toLocaleString());
}

function convertMSToTime(millisec) {
  var seconds = (millisec / 1000).toFixed(0);
  var minutes = Math.floor(seconds / 60);
  var hours = "";
  if (minutes > 59) {
    hours = Math.floor(minutes / 60);
    hours = hours >= 10 ? hours : "0" + hours;
    minutes = minutes - hours * 60;
    minutes = minutes >= 10 ? minutes : "0" + minutes;
  }

  seconds = Math.floor(seconds % 60);
  seconds = seconds >= 10 ? seconds : "0" + seconds;
  if (hours != "") {
    return hours + ":" + minutes + ":" + seconds;
  }
  return minutes + ":" + seconds;
}

async function dailyReset(c, guild) {
  const embedDailyEndGameTime = new EmbedBuilder()
    .setTitle("**Daily Top 5 Fastest Times**")
    .setColor("#00ff0d");

  const entries = await userDataModel
    .find({ finishedToday: true })
    .sort({ finalGameTime: 1 })
    .catch((err) => console.log(err));

  const topFive = entries.slice(0, 5);

  let desc = "";
  var removentryWithoutGameTime = 0;
  for (let i = 0; i < topFive.length; i++) {
    if (!topFive[i].finalGameTime) {
      removentryWithoutGameTime++;
      continue;
    }
    let { user } = await guild.members.fetch(topFive[i].userId);
    if (!user) return;
    userData = await userDataModel.findOne({ userId: user.id });
    if (!userData) return;
    const { ign } = userData;
    const pointsIncreasedBy = 5 - i;
    playerScore = await playerScoreModel.findOneAndUpdate(
      { userId: topFive[i].userId },
      {
        $inc: {
          points: pointsIncreasedBy,
        },
      }
    );
    let userGameTime = convertMSToTime(topFive[i].finalGameTime);
    desc +=
      i +
      1 -
      removentryWithoutGameTime +
      ". " +
      ign +
      ": " +
      userGameTime +
      " (" +
      pointsIncreasedBy +
      " points)" +
      "\n";
  }
  if (entries.length > 4) {
    const entrycount = entries.length + 1;
    desc += "\nGames Submitted Today: " + entrycount;
  }
  if (desc !== "") {
    embedDailyEndGameTime.setDescription(desc);
  }

  guild.channels.cache.get("1277894556330889282").send({ embeds: [embedDailyEndGameTime] });

  var randomMapIdx = Math.floor(Math.random() * mapsPossible.length);
  var RandomMapName = mapsPossible[randomMapIdx];
  mapsPossible.splice(randomMapIdx, 1);
  mapRequired = RandomMapName;
  await globalDataModel.findOneAndUpdate(
    { serverId: 1275151026269454377 },
    {
      $set: {
        map: mapRequired,
      },
    }
  );
  guild.channels.cache
    .get("1277894556330889282")
    .send("The map for today is: **" + mapRequired + "**");

  try {
    userDataModel
      .deleteMany({})
      .then((deleteManyResult) => {
        console.log("Successfully deleted:", deleteManyResult.deletedCount, "documents");
      })
      .catch((err) => {
        console.log("Error:", err);
      });
  } catch (err) {
    console.log(err);
  }

  // c.channels.cache
  //   .get("1277894556330889282")
  //   .send("Time remaining till reset: **" + counterReset + " hours**")
  //   .then((msg) => {
  //     setTimeout(() => msg.delete(), 86400 * 1000);
  //   });
}

// when a new user joins the server, update the members channel (the channel with a 🌎 emoji.)
client.on("guildMemberAdd", (member) => {
  let addRole = member.guild.roles.cache.find((role) => role.name === "Members");
  member.roles.add(addRole);
  updateMemberCount(member.guild);
});

// when a user leaves the server, update the members channel (the channel with a 🌎 emoji.)
client.on("guildMemberRemove", (member) => {
  updateMemberCount(member.guild);
});

client.on("ready", async (c) => {
  console.log(`✅ ${c.user.username} is online! (1/2)`);

  connectToDB();

  client.user.setActivity({
    name: "Battles",
    type: ActivityType.Watching,
  });

  // gets the required map from the database which is displayed when the /map command is used
  globalDataStartupMapSet = await globalDataModel.findOne({
    serverId: 1275151026269454377,
  });
  const { map } = globalDataStartupMapSet;
  mapRequired = map;

  // when the bot starts up, update the members channel (the channel with a 🌎 emoji.)
  const guild = c.guilds.cache.get("1275151026269454377");
  updateMemberCount(guild);

  setInterval(() => dailyReset(c, guild), 86400 * 1000);

  // we use the 30 minutes test to see if the bot is active. It also lets us know if it crashed. Every 30 minutes, it counts up and posts a message in the #30min-test channel
  setInterval(() => {
    count30 += 1;
    c.channels.cache.get("1281298277173559449").send("30 minutes test: " + count30);
  }, 1800 * 1000);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "bedwars") {
    await interaction.deferReply({ ephemeral: true });
    if (!interaction.options.get("ign")) {
      interaction.editReply({ content: "Enter an ign.", ephemeral: true });
      return;
    }

    var playerInteractionName = interaction.options.get("ign").value;
    console.log("(/bedwars) Getting stats for " + playerInteractionName);

    const playerMinecraftResponse = await axios
      .get(`https://api.mojang.com/users/profiles/minecraft/${playerInteractionName}`)
      .catch((err) => console.log("coudln't find stats :("));

    if (playerMinecraftResponse == null) {
      interaction.reply(
        "Error getting stats for **" +
          playerInteractionName +
          "**\nCause: Player does not exist. Check if the name is correctly spelled."
      );
    } else {
      const uuid = playerMinecraftResponse.data.id;

      const playerHypixelResponse = await axios
        .get(`https://api.hypixel.net/player?key=${process.env.API_KEY}&uuid=${uuid}`)
        .catch((err) => console.log(err));
      const statusHypixelResponse = await axios
        .get(`https://api.hypixel.net/status?key=${process.env.API_KEY}&uuid=${uuid}`)
        .catch((err) => console.log(err));

      if (
        playerHypixelResponse.data.success == false ||
        playerHypixelResponse.data.player == false
      ) {
        interaction.editReply(
          "Failed to fetch player stats for " +
            playerInteractionName +
            "\nPlayer has Stats API disabled."
        );
      }

      let statusOnline = "0";

      if (statusHypixelResponse.data.success && statusHypixelResponse.data.success) {
        if (statusHypixelResponse.data.session.online) {
          statusOnline = "1";
        } else {
          statusOnline = "2";
        }
      }

      if (playerHypixelResponse.data.success == true && playerHypixelResponse.data.player != null) {
        let lvl = playerHypixelResponse.data.player.achievements.bedwars_level;

        let wins = playerHypixelResponse.data.player.stats.Bedwars.wins_bedwars;
        let losses = playerHypixelResponse.data.player.stats.Bedwars.losses_bedwars;

        let finalKills = playerHypixelResponse.data.player.stats.Bedwars.final_kills_bedwars;
        let finalDeaths = playerHypixelResponse.data.player.stats.Bedwars.final_deaths_bedwars;

        let kills = playerHypixelResponse.data.player.stats.Bedwars.kills_bedwars;
        let deaths = playerHypixelResponse.data.player.stats.Bedwars.deaths_bedwars;

        let bedsBroken = playerHypixelResponse.data.player.stats.Bedwars.beds_broken_bedwars;
        let bedsLost = playerHypixelResponse.data.player.stats.Bedwars.beds_lost_bedwars;

        let typeOnline = "?";
        if (statusOnline === "0") {
          typeOnline = "API Disabled";
        } else if (statusOnline === "1") {
          typeOnline = "Online";
        } else {
          typeOnline = "Offline";
        }

        const Embed = new EmbedBuilder()
          .setColor("#00ff0d")
          .setTitle(playerInteractionName + "'s Bedwars Stats")
          .setThumbnail("https://minotar.net/avatar/" + uuid)
          .addFields(
            { name: "Level", value: `${lvl}`, inline: true },
            { name: "Status", value: `${typeOnline}`, inline: true },
            { name: "-", value: `-`, inline: true }
          )
          .addFields(
            { name: "Wins", value: `${wins}`, inline: true },
            { name: "Losses", value: `${losses}`, inline: true },
            { name: "WLR", value: `${(wins / losses).toFixed(3)}`, inline: true }
          )
          .addFields(
            { name: "Final Kills", value: `${finalKills}`, inline: true },
            { name: "Final Deaths", value: `${finalDeaths}`, inline: true },
            { name: "FKDR", value: `${(finalKills / finalDeaths).toFixed(3)}`, inline: true }
          )
          .addFields(
            { name: "Kills", value: `${kills}`, inline: true },
            { name: "Deaths", value: `${deaths}`, inline: true },
            { name: "KDR", value: `${(kills / deaths).toFixed(3)}`, inline: true }
          )
          .addFields(
            { name: "Beds Broken", value: `${bedsBroken}`, inline: true },
            { name: "Beds Lost", value: `${bedsLost}`, inline: true },
            { name: "BBLR", value: `${(bedsBroken / bedsLost).toFixed(3)}`, inline: true }
          )
          .setFooter({
            text: `Requested by ${interaction.user.username}`,
            iconURL: interaction.user.iconURL,
          });

        interaction.editReply({ embeds: [Embed] });
      }
    }
  }

  if (interaction.commandName === "start") {
    await interaction.deferReply({ ephemeral: true });
    if (!interaction.options.get("ign")) {
      interaction.editReply({ content: "Enter an ign.", ephemeral: true });
      return;
    }
    userDataCheckFinished = await userDataModel.findOne({
      userId: interaction.user.id,
    });
    if (userDataCheckFinished) {
      const { disqualified } = userDataCheckFinished;
      const { finishedToday } = userDataCheckFinished;
      if (disqualified) {
        interaction.editReply({
          content: "Sorry, you have been disqualified. Come back tomorrow!",
          ephemeral: true,
        });
        return;
      }
      if (finishedToday) {
        interaction.editReply({
          content: "You have already completed today's challenge. Come back tomorrow for more!",
          ephemeral: true,
        });
        return;
      }
    }

    var ign = interaction.options.get("ign").value;

    console.log("Getting stats for " + ign);
    const playerMinecraftResponse = await axios
      .get(`https://api.mojang.com/users/profiles/minecraft/${ign}`)
      .catch((err) => console.log("coudln't find player :("));
    if (playerMinecraftResponse == null) {
      interaction.editReply({
        content: "Error getting uuid for **" + ign + "**. Check if name is correctly spelled.",
        ephemeral: true,
      });
    } else {
      const uuid = playerMinecraftResponse.data.id;

      const recentgamesHypixelResponseCheckIgnAndRecentGamesEnabled = await axios
        .get(`https://api.hypixel.net/recentgames?key=${process.env.API_KEY}&uuid=${uuid}`, {
          timeout: 30000,
          keepAlive: true,
        })
        .catch((err) => {
          if (err instanceof AggregateError) {
            console.log(err.errors);
          } else {
            console.log(err);
          }
        });
      try {
        var dateTry = Object.values(
          recentgamesHypixelResponseCheckIgnAndRecentGamesEnabled.data.games
        )[0].date;
      } catch (e) {
        interaction.editReply({
          content:
            "There was an error with Hypixel's Recent Games API. The possible reasons for this are:\n- You have your Recent Games turned off in your hypixel settings.\n- There is a temoprary problem with the Hypixel API. (If you think this was the case, try using /start again.)",
          ephemeral: true,
        });
        return;
      }

      const playerHypixelResponse = await axios
        .get(`https://api.hypixel.net/player?key=${process.env.API_KEY}&uuid=${uuid}`)
        .catch((err) => console.log(err));

      if (
        playerHypixelResponse.data.success == false ||
        playerHypixelResponse.data.player == false
      ) {
        interaction.editReply("Failed to fetch player stats for " + ign + "\n Cause: Hypixel API");
        return;
      }
      if (playerHypixelResponse.data.success == true && playerHypixelResponse.data.player != null) {
        ign = playerHypixelResponse.data.player.displayname;
        let startSoloGamesPlayed =
          playerHypixelResponse.data.player.stats.Bedwars.eight_one_games_played_bedwars;
        let startWins = playerHypixelResponse.data.player.stats.Bedwars.wins_bedwars;
        let startFinalKills = playerHypixelResponse.data.player.stats.Bedwars.final_kills_bedwars;
        let startBedsBroken = playerHypixelResponse.data.player.stats.Bedwars.beds_broken_bedwars;
        let userData;
        try {
          userData = await userDataModel.findOne({
            userId: interaction.user.id,
          });
          if (!userData) {
            userData = await userDataModel.create({
              userId: interaction.user.id,
              ign: ign,
              startGamesPlayed: startSoloGamesPlayed,
              startFinalKills: startFinalKills,
              startBedsBroken: startBedsBroken,
              startWins: startWins,
              finishedToday: false,
              disqualified: false,
            });
            interaction.editReply({
              content:
                "The challenge has started! Play **1 game of bedwars** on the map **" +
                mapRequired +
                "** and use the **/submit** command.",
              ephemeral: true,
            });
          } else {
            console.log(userData);
            interaction.editReply({
              content: "You have **already started the challenge**.",
              ephemeral: true,
            });
          }
        } catch (err) {
          console.log(err);
        }
      }
    }
  }

  if (interaction.commandName === "submit") {
    await interaction.deferReply({ ephemeral: true });
    try {
      userData = await userDataModel.findOne({ userId: interaction.user.id });
      if (!userData) {
        interaction.editReply({
          content: "Use the **/start** command to start the challenge first!",
          ephemeral: true,
        });
      } else {
        const { disqualified } = userData;
        if (disqualified) {
          interaction.editReply({
            content: "Sorry, you have been disqualified. Come back tomorrow!",
            ephemeral: true,
          });
          return;
        }
        const { finishedToday } = userData;
        if (finishedToday) {
          interaction.editReply({
            content: "You have already completed today's challenge. Come back tomorrow for more!",
            ephemeral: true,
          });
          return;
        }
        const { ign } = userData;
        const playerMinecraftResponse = await axios
          .get(`https://api.mojang.com/users/profiles/minecraft/${ign}`)
          .catch((err) => console.log("coudln't find player :("));
        const uuid = playerMinecraftResponse.data.id;
        const playerHypixelResponse = await axios
          .get(`https://api.hypixel.net/player?key=${process.env.API_KEY}&uuid=${uuid}`)
          .catch((err) => console.log(err));
        const recentgamesHypixelResponse = await axios
          .get(`https://api.hypixel.net/recentgames?key=${process.env.API_KEY}&uuid=${uuid}`, {
            timeout: 30000,
            keepAlive: true,
          })
          .catch((err) => {
            if (err instanceof AggregateError) {
              console.log(err.errors);
            } else {
              console.log(err);
            }
          });
        if (
          playerHypixelResponse.data.success == false ||
          playerHypixelResponse.data.player == false ||
          recentgamesHypixelResponse.data.success == false
        ) {
          interaction.editReply(
            "Failed to fetch player stats for " + ign + "\n Cause: Hypixel API"
          );
          return;
        }
        let endSoloGamesPlayed =
          playerHypixelResponse.data.player.stats.Bedwars.eight_one_games_played_bedwars;
        let endWins = playerHypixelResponse.data.player.stats.Bedwars.wins_bedwars;
        let endFinalKills = playerHypixelResponse.data.player.stats.Bedwars.final_kills_bedwars;
        let endBedsBroken = playerHypixelResponse.data.player.stats.Bedwars.beds_broken_bedwars;

        const { startGamesPlayed } = userData;
        const { startFinalKills } = userData;
        const { startBedsBroken } = userData;
        const { startWins } = userData;

        let gameStartTimeMS = Object.values(recentgamesHypixelResponse.data.games)[0].date;
        let gameEndTimeMS = Object.values(recentgamesHypixelResponse.data.games)[0].ended;
        const mapPlayed = Object.values(recentgamesHypixelResponse.data.games)[0].map;

        const gamesPlayed = endSoloGamesPlayed - startGamesPlayed;
        const finalKills = endFinalKills - startFinalKills;
        const bedsBroken = endBedsBroken - startBedsBroken;
        var won = false;
        if (endWins == startWins) {
          won = false;
        } else {
          won = true;
        }
        var wonText = "";
        if (won) {
          wonText = "Yes";
        } else {
          wonText = "No";
        }
        const gameTimeMS = gameEndTimeMS - gameStartTimeMS;
        const gameTime = convertMSToTime(gameTimeMS);

        if (Number.isNaN(gameTime)) {
          interaction.editReply(
            "The game you played has not ended yet. Try again after it has ended."
          );
          return;
        }

        if (gameTime == "NaN") {
          interaction.editReply(
            "The game you played has not ended yet. Try again after it has ended."
          );
          return;
        }

        console.log(mapPlayed);
        console.log(mapRequired);

        console.log(gamesPlayed);
        if (mapPlayed != mapRequired) {
          const wrongMapEmbed = new EmbedBuilder()
            .setColor("#FF0000")
            .setImage(
              "https://cdn.discordapp.com/attachments/1276374770228662353/1277293105690841220/challenge_disqualified_map_200.png?ex=66cca367&is=66cb51e7&hm=17c62b2aaa33b7d9c85120cf5dfcff021783120d8e84d6de5233b29ecf469a12&"
            );

          interaction.editReply({ embeds: [wrongMapEmbed] });
          await userDataModel.findOneAndUpdate(
            { userId: interaction.user.id },
            { $set: { disqualified: true } }
          );
          return;
        }

        var timeReduced = 0;
        timeReduced += finalKills * 5000;
        timeReduced += bedsBroken * 5000;
        var timeIncreasedByLoss = 0;
        if (won) {
          timeIncreasedByLoss = 0;
        } else {
          timeIncreasedByLoss = 300000;
        }

        const gameTimeFinalMS = gameTimeMS - timeReduced + timeIncreasedByLoss;
        const gameTimeFinal = convertMSToTime(gameTimeFinalMS);

        await interaction.client.channels.cache
          .get("1282678410996486154")
          .send("New User Sumbitted: ");
        await interaction.guild.channels.cache.get("1282678410996486154").send("Ign: " + ign);
        await interaction.guild.channels.cache
          .get("1282678410996486154")
          .send("Final Kills: " + finalKills);
        await interaction.guild.channels.cache
          .get("1282678410996486154")
          .send("Beds Broken: " + bedsBroken);
        await interaction.guild.channels.cache
          .get("1282678410996486154")
          .send("Game Time: " + gameTime);
        await interaction.guild.channels.cache
          .get("1282678410996486154")
          .send("Game Time (in ms): " + gameTimeMS);
        await interaction.guild.channels.cache.get("1282678410996486154").send("Map: " + mapPlayed);
        await interaction.guild.channels.cache.get("1282678410996486154").send("Won: " + wonText);
        await interaction.guild.channels.cache
          .get("1282678410996486154")
          .send("Final Game Time: " + gameTimeFinal);
        await interaction.guild.channels.cache
          .get("1282678410996486154")
          .send("Final Game Time (in ms): " + gameTimeFinalMS);

        if (gamesPlayed == 0) {
          interaction.editReply({
            content: "You have not played any games since you ran the /start command",
            ephemeral: true,
          });
        }
        if (gamesPlayed > 1) {
          const moreThanOneGamesPlayedEmbed = new EmbedBuilder()
            .setColor("#FF0000")
            .setImage(
              "https://cdn.discordapp.com/attachments/1276374770228662353/1277293135558348941/challenge_disqualified_2_201.png?ex=66cca36e&is=66cb51ee&hm=ab953c9bd308cfc972fe5d2f5e65c46371295f3cbdec9179054136c59c999e9b&"
            );

          interaction.editReply({ embeds: [moreThanOneGamesPlayedEmbed] });
          await userDataModel.findOneAndUpdate(
            { userId: interaction.user.id },
            { $set: { disqualified: true } }
          );
        } else {
          const imgEmbedEnd = new EmbedBuilder()
            .setColor("#00ff0d")
            .setImage(
              "https://cdn.discordapp.com/attachments/1276374770228662353/1276777239886958744/battletracker_challenge_complete.gif?ex=66cac2f7&is=66c97177&hm=bf9b6ddec7dec6b6ba942ac82abafadf6f642704134460e2b8385adbf67f82a3&"
            );

          await interaction.channel.send({ embeds: [imgEmbedEnd], ephemeral: false });

          const EmbedEnd = new EmbedBuilder()
            .setColor("#00ff0d")
            .setThumbnail("https://minotar.net/avatar/" + ign)
            .setTitle(ign + "'s stats")
            .setFields(
              { name: "Final Kills", value: finalKills + "", inline: true },
              { name: "Beds Broken", value: bedsBroken + "", inline: true },
              { name: "Game Time", value: gameTime, inline: true },
              { name: "Map Played", value: mapPlayed, inline: true },
              { name: "Game Won", value: wonText, inline: true },
              { name: "Final Game Time", value: gameTimeFinal, inline: true }
            )
            .setFooter({ text: "For: " + interaction.user.username });

          await interaction.channel.send({ embeds: [EmbedEnd], ephemeral: false });

          await userDataModel.findOneAndUpdate(
            { userId: interaction.user.id },
            {
              $set: {
                finishedToday: true,
              },
            }
          );
          await userDataModel.findOneAndUpdate(
            { userId: interaction.user.id },
            {
              $set: {
                finalGameTime: gameTimeFinalMS,
              },
            }
          );
          playerScore = await playerScoreModel.findOne({
            userId: interaction.user.id,
          });
          console.log(playerScore);
          if (!playerScore) {
            playerScore = await playerScoreModel.create({
              userId: interaction.user.id,
              ign: ign,
              gameTime: 0,
              points: 0,
            });
          }
          await playerScoreModel.updateOne(
            { userId: interaction.user.id },
            {
              $set: {
                gameTime: gameTimeFinalMS,
              },
            }
          );
          await playerScoreModel.updateOne(
            { userId: interaction.user.id },
            {
              $inc: {
                gamesSubmitted: 1,
              },
            }
          );
        }
      }
    } catch (err) {
      console.log(err);
    }
  }

  if (interaction.commandName === "map") {
    if (!interaction.options.get("map")) {
      interaction.reply({
        content: "Currently required map is " + mapRequired,
        ephemeral: true,
      });
    } else {
      if (
        !interaction.member
          .permissionsIn(interaction.channel)
          .has(PermissionsBitField.Flags.Administrator)
      ) {
        interaction.reply({
          content:
            "You do not have permission to change the map. Run the /map command without any map input to check the currently required map.",
          ephemeral: true,
        });
        return;
      }
      mapRequired = interaction.options.get("map").value;
      try {
        globalData = await globalDataModel.findOne({
          serverId: interaction.guild.id,
        });
        console.log(globalData);
        if (!globalData) {
          globalData = await globalDataModel.create({
            serverId: interaction.guild.id,
            map: mapRequired,
          });
          interaction.reply("Map entry was created and the map was set to " + mapRequired);
          return;
        }
        await globalDataModel.findOneAndUpdate(
          { serverId: interaction.guild.id },
          {
            $set: {
              map: mapRequired,
            },
          }
        );
        interaction.reply({
          content: "Map was set to " + mapRequired,
          ephemeral: true,
        });
      } catch (err) {
        console.log(err);
      }
    }
  }

  if (interaction.commandName === "reset") {
    try {
      const ignToRemove = interaction.options.get("ign").value;

      try {
        userDataModel
          .findOneAndDelete({ ign: ignToRemove, ign: ignToRemove })
          .then((deleteOneResult) => {
            console.log(deleteOneResult);
          });
      } catch (err) {
        console.log(err);
      }

      interaction.reply({
        content: "Deleted " + ignToRemove + "'s stats for the day.",
        ephemeral: true,
      });
    } catch (err) {
      interaction.reply({ content: "Enter an ign.", ephemeral: true });
    }
  }

  if (interaction.commandName === "profile") {
    try {
      const ignEntered = interaction.options.get("ign").value;
      interaction.reply({
        content:
          "Checking profiles of other users is not supported yet. Try using /profile without an ign.",
        ephemeral: true,
      });
    } catch (Err) {
      try {
        const type = interaction.options.get("type").value;

        if (!type) {
          interaction.reply("Select the type of profile you want to view!");
          return;
        }

        if (type == "daily") {
          userData = await userDataModel.findOne({ userId: interaction.user.id });
          if (!userData) {
            interaction.reply("You have not played any games today!");
            return;
          }

          const { ign } = userData;
          const { finalGameTime } = userData;

          const embedDailyProfile = new EmbedBuilder()
            .setColor("#00ff0d")
            .setThumbnail("https://minotar.net/avatar/" + ign)
            .setTitle("**" + interaction.user.username + "'s Daily Profile**")
            .setDescription(
              "IGN: " + ign + "\nToday's Game Time: " + convertMSToTime(finalGameTime)
            );

          await interaction.reply({
            embeds: [embedDailyProfile],
          });
        } else if (type == "season") {
          playerScore = await playerScoreModel.findOne({
            userId: interaction.user.id,
          });
          if (!playerScore) {
            interaction.reply("You do not have any points this season!");
            return;
          }

          const { ign } = playerScore;
          const { points } = playerScore;
          const { gamesSubmitted } = playerScore;
          const { fastestGameTime } = playerScore;

          const embedSeasonalProfile = new EmbedBuilder()
            .setColor("#00ff0d")
            .setThumbnail("https://minotar.net/avatar/" + ign)
            .setTitle("**" + interaction.user.username + "'s Seasonal Profile**")
            .setDescription(
              "IGN: " +
                ign +
                "\nPoints: " +
                points +
                "\nGames Submitted: " +
                gamesSubmitted +
                "\nFastest Game Time: " +
                convertMSToTime(fastestGameTime) +
                "\n\n These stats are for this season only."
            );

          await interaction.reply({
            embeds: [embedSeasonalProfile],
          });
        } else if (type == "lifetime") {
          interaction.reply({
            content: "Sorry, lifetime data is not available yet.",
            ephemeral: true,
          });
        }
      } catch (err) {
        console.log(err);
        interaction.reply({
          content: "Select the type of profile you want to view.",
          ephemeral: true,
        });
        return;
      }
    }
  }

  if (interaction.commandName === "leaderboard") {
    try {
      const type = interaction.options.get("type").value;
      if (type == "season") {
        const imgEmbedSeasonLeaderboard = new EmbedBuilder()
          .setColor("#00ff0d")
          .setImage(
            "https://cdn.discordapp.com/attachments/1276374770228662353/1277295596121886873/leaderboard_season.gif?ex=66cff179&is=66ce9ff9&hm=76f6f04d4c0da3b5541ac5544bf6ca93c0ef61e074b4817854756d5019e6c720&"
          );

        await interaction.reply({ embeds: [imgEmbedSeasonLeaderboard] });
        const embedSeasonLeaderboardOnDemand = new EmbedBuilder()
          .setTitle("**Top 5 Points This Season**")
          .setColor("#00ff0d");

        const entries = await playerScoreModel
          .find()
          .sort({ points: -1 })
          .catch((err) => console.log(err));

        const topFive = entries.slice(0, 5);

        let desc = "";
        var removentryWithoutGameTime = 0;
        for (let i = 0; i < topFive.length; i++) {
          if (!topFive[i].points) {
            removentryWithoutGameTime++;
            continue;
          }
          let { user } = await interaction.guild.members.fetch(topFive[i].userId);
          if (!user) return;
          userData = await playerScoreModel.findOne({ userId: user.id });
          if (!userData) return;
          const { ign } = userData;
          let points = topFive[i].points;
          desc += i + 1 - removentryWithoutGameTime + ". " + ign + ": " + points + "\n";
        }
        if (desc !== "") {
          embedSeasonLeaderboardOnDemand.setDescription(desc);
        }

        await interaction.channel.send({
          embeds: [embedSeasonLeaderboardOnDemand],
        });
      } else if (type == "daily") {
        const imgEmbedDailyLeaderboard = new EmbedBuilder()
          .setColor("#00ff0d")
          .setImage(
            "https://cdn.discordapp.com/attachments/1276374770228662353/1277295575733108857/leaderboard_daily.gif?ex=66ce9ff4&is=66cd4e74&hm=02d9aadd5e15a70211edd1231abfc758908366494bafdf1ce8647e06759c932d&"
          );

        await interaction.reply({ embeds: [imgEmbedDailyLeaderboard] });
        const embedDailyLeaderboardOnDemand = new EmbedBuilder()
          .setTitle("**Daily Top 5 Fastest Times**")
          .setColor("#00ff0d");

        const entries = await userDataModel
          .find({ finishedToday: true })
          .sort({ finalGameTime: 1 })
          .catch((err) => console.log(err));

        const topFive = entries.slice(0, 5);

        let desc = "";
        var removentryWithoutGameTime = 0;
        for (let i = 0; i < topFive.length; i++) {
          if (!topFive[i].finalGameTime) {
            removentryWithoutGameTime++;
            continue;
          }
          let { user } = await interaction.guild.members.fetch(topFive[i].userId);
          if (!user) {
            console.log("Index " + i + " was omitted due to not having an userId");
            return;
          }
          userData = await userDataModel.findOne({ userId: user.id });
          if (!userData) {
            console.log("Index " + i + " was omitted due to not having userData");
            return;
          }
          const { ign } = userData;
          let userGameTime = convertMSToTime(topFive[i].finalGameTime);
          desc += i + 1 - removentryWithoutGameTime + ". " + ign + ": " + userGameTime + "\n";
        }
        if (desc == "") {
          desc = "No games to display yet.";
        }
        if (entries.length > 4) {
          const entrycount = entries.length + 1;
          desc += "\nGames Submitted Today: " + entrycount;
        }
        if (desc !== "") {
          embedDailyLeaderboardOnDemand.setDescription(desc);
        }

        await interaction.channel.send({
          embeds: [embedDailyLeaderboardOnDemand],
        });
      }
    } catch (Err) {
      console.log(Err);
      interaction.reply({
        content: "Select the type of leaderboard you want to view!",
        ephemeral: true,
      });
    }
  }

  // recentgames shows the last 2 games the player whose ign was entered has played. Used for debugging
  if (interaction.commandName === "recentgames") {
    try {
      ignEntered = interaction.options.get("ign").value;

      const playerMinecraftResponse = await axios
        .get(`https://api.mojang.com/users/profiles/minecraft/${ignEntered}`)
        .catch((err) => console.log("coudln't find player :("));
      if (playerMinecraftResponse == null) {
        interaction.reply({
          content: "Error getting uuid for **" + ign + "**. Check if name is correctly spelled.",
          ephemeral: true,
        });
        return;
      }
      const uuid = playerMinecraftResponse.data.id;
      const recentgamesHypixelResponse = await axios
        .get(`https://api.hypixel.net/recentgames?key=${process.env.API_KEY}&uuid=${uuid}`)
        .catch((err) => console.log(err));

      try {
        var game1Map = Object.values(recentgamesHypixelResponse.data.games)[0].map;
        var game2Map = Object.values(recentgamesHypixelResponse.data.games)[1].map;
        var game1Type = Object.values(recentgamesHypixelResponse.data.games)[0].gameType;
        var game2Type = Object.values(recentgamesHypixelResponse.data.games)[1].gameType;
        var game1Started = Object.values(recentgamesHypixelResponse.data.games)[0].date;
        var game1Ended = Object.values(recentgamesHypixelResponse.data.games)[0].ended;
        var game2Started = Object.values(recentgamesHypixelResponse.data.games)[1].date;
        var game2Ended = Object.values(recentgamesHypixelResponse.data.games)[1].ended;

        // hypixel api returns the date in UNIX time (milliseconds), we convert it to readable time
        var game1StartDate = new Date(game1Started).toGMTString();
        var game1EndDate = new Date(game1Ended).toGMTString();
        var game2StartDate = new Date(game2Started).toGMTString();
        var game2EndDate = new Date(game2Ended).toGMTString();

        const EmbedRecentGames = new EmbedBuilder()
          .setColor("#00ff0d")
          .setThumbnail("https://minotar.net/avatar/" + ignEntered)
          .setTitle(ignEntered + "'s Recent Games")
          .setDescription(
            "**Game 1**" +
              "\nGame Mode: " +
              game1Type +
              "\nMap: " +
              game1Map +
              "\nStarted: " +
              game1StartDate +
              "\nEnded: " +
              game1EndDate +
              "\n\n**Game 2**" +
              "\nGame Mode: " +
              game2Type +
              "\nMap: " +
              game2Map +
              "\nStarted: " +
              game2StartDate +
              "\nEnded: " +
              game2EndDate
          );

        interaction.reply({ embeds: [EmbedRecentGames] });
      } catch (err) {
        interaction.reply({
          content:
            "That player either has recent games turned **off** in their **hypixel settings** or they have played **less than 2 games** since they turned it on.",
          ephemeral: true,
        });
      }
    } catch (err) {
      console.log(err);
      interaction.reply({
        content: "Enter the ign of a player to view their recent games!",
        ephemeral: true,
      });
    }
  }
});

client.on("messageCreate", (message) => {
  if (message.author.bot) return;
});

client.login(process.env.TOKEN);
