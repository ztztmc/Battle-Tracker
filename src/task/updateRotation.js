require("dotenv").config();
const { CronJob } = require("cron");
const CurrentPool = require("../models/map-rotation/currentPool");
const RotationMessage = require("../models/map-rotation/rotationMessage");
const { fetchMapRotation } = require("../utils/fetchRotation");
const { EmbedBuilder } = require("discord.js");
const axios = require("axios");

async function isSoloMap(mapName) {
  try {
    const response = await axios.get(
      "https://api.polsu.xyz/polsu/bedwars/map",
      {
        params: { map: mapName },
        headers: { "API-Key": process.env.POLSU_API_KEY },
      }
    );

    const mode = response.data?.data?.mode;
    return mode === "2";
  } catch (err) {
    console.warn(`Polsu API failed for ${mapName}:`, err.message);
    return false;
  }
}

// Group maps into chunks of 10 for embed fields
function chunkArray(array, size) {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

async function startPoolUpdaterCron(client) {
  const job = new CronJob(
    "0 9 * * *", // 9:00 AM
    async () => {
      try {
        const channel = await client.channels.fetch("1275151284067893414");
        const currentTime = new Date().toLocaleString();
        if (channel && channel.isTextBased()) {
          await channel.send(
            `Daily rotation updater started at ${currentTime}`
          );
        } else {
          console.error("Fetched channel is not text-based.");
        }

        const rotation = await fetchMapRotation();
        if (!rotation) return;

        const current = await CurrentPool.findOne();
        if (!current) {
          console.warn("No current pool found in DB. Please seed it manually.");
          return;
        }

        const updatedMaps = current.maps.filter(
          (map) => !rotation.leaving.includes(map)
        );

        for (const map of rotation.entering) {
          const alreadyExists = updatedMaps.includes(map);
          if (!alreadyExists && (await isSoloMap(map))) {
            updatedMaps.push(map);
          }
        }

        updatedMaps.sort((a, b) => a.localeCompare(b));

        // Check if changed
        const same =
          updatedMaps.length === current.maps.length &&
          updatedMaps.every((map) => current.maps.includes(map));

        if (same) return;

        // Save updated pool to DB
        current.maps = updatedMaps;
        await current.save();

        const chunks = chunkArray(updatedMaps, 10);
        const fields = chunks.map((group, index) => ({
          name: `Maps ${index * 10 + 1}–${index * 10 + group.length}`,
          value: group.map((m) => `- ${m}`).join("\n"),
          inline: true,
        }));

        const poolChannel = await client.channels.fetch(
          process.env.MAP_POOL_CHANNEL_ID
        );
        const embed = new EmbedBuilder()
          .setDescription(
            `### ${process.env.ICON_MAP} **Bedwars Maps (Solo/Doubles)**`
          )
          .setColor("Green")
          .addFields(fields)
          .setFooter({ text: `Updates daily. Last updated: ${currentTime}` });

        const existing = await RotationMessage.findOne({ type: "map_pool" });

        if (existing?.messageId) {
          try {
            const oldMsg = await poolChannel.messages.fetch(existing.messageId);
            if (oldMsg) await oldMsg.delete();
          } catch (e) {
            console.warn("Could not delete old map pool message:", e.message);
          }
        }

        const newMsg = await poolChannel.send({ embeds: [embed] });

        const formattedPool = updatedMaps.join(",");

        if (!existing) {
          await RotationMessage.create({
            type: "map_pool",
            messageId: newMsg.id,
            lastRotationText: formattedPool,
          });
        } else {
          existing.messageId = newMsg.id;
          existing.lastRotationText = formattedPool;
          await existing.save();
        }
        const updatesChannel = await client.channels.fetch(
          process.env.MAP_UPDATES_CHANNEL_ID
        );
        const rotationEmbed = new EmbedBuilder()
          .setDescription(
            `### ${process.env.ICON_REFRESH} **Bedwars Rotation Update**`
          )
          .setColor("Green")
          .addFields(
            {
              name: `${process.env.ICON_PLUS} Entering`,
              value: rotation.entering.length
                ? rotation.entering
                    .map((m) => `${process.env.ICON_EMPTY} ${m}`)
                    .join("\n")
                : "None",
              inline: true,
            },
            {
              name: `${process.env.ICON_MINUS} Leaving`,
              value: rotation.leaving.length
                ? rotation.leaving
                    .map((m) => `${process.env.ICON_EMPTY} ${m}`)
                    .join("\n")
                : "None",
              inline: true,
            }
          );
        const lastRotation = await RotationMessage.findOne({
          type: "last_rotation",
        });
        const newRotationText = `${rotation.entering.join(
          ","
        )}::${rotation.leaving.join(",")}`;

        if (
          !lastRotation ||
          lastRotation.lastRotationText !== newRotationText
        ) {
          await updatesChannel.send({ embeds: [rotationEmbed] });

          if (!lastRotation) {
            await RotationMessage.create({
              type: "last_rotation",
              lastRotationText: newRotationText,
            });
          } else {
            lastRotation.lastRotationText = newRotationText;
            await lastRotation.save();
          }
        }
      } catch (err) {
        console.error("Error in daily rotation updater:", err);
        if (err.stack) console.error(err.stack);
      }
    },
    null,
    true,
    "America/New_York"
  );
  job.start();
}

module.exports = { startPoolUpdaterCron };
