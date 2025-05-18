require('dotenv').config();
const cron = require("node-cron");
const CurrentPool = require("../models/currentPool");
const RotationMessage = require("../models/rotationMessage");
const { fetchMapRotation } = require("../utils/fetchRotation");
const { EmbedBuilder } = require("discord.js");

function startPoolUpdaterCron(client) {
  cron.schedule("0 8 * * *", async () => {
    try {
      const currentTime = new Date().toLocaleString();
      console.log(`[${currentTime}] Updating map pool...`);
      const rotation = await fetchMapRotation();
      if (!rotation) return;

      const current = await CurrentPool.findOne();
      if (!current) {
        console.warn("No current pool found in DB. Please seed it manually.");
        return;
      }

      const updatedMaps = current.maps
        .filter(map => !rotation.leaving.includes(map));

      for (const map of rotation.entering) {
        if (!updatedMaps.includes(map)) {
          updatedMaps.push(map);
        }
      }

      // Check if changed
      const same =
        updatedMaps.length === current.maps.length &&
        updatedMaps.every(map => current.maps.includes(map));

      if (same) return;

      // Save updated pool to DB
      current.maps = updatedMaps;
      await current.save();

      // Format full map pool
      const formattedPool = updatedMaps.map(m => `- ${m}`).join("\n");

      // Send updated full pool to MAP_POOL_CHANNEL_ID
      const poolChannel = await client.channels.fetch(process.env.MAP_POOL_CHANNEL_ID);
      const embed = new EmbedBuilder()
        .setTitle("Current BedWars Map Pool")
        .setColor("Green")
        .setDescription(formattedPool)
        .setTimestamp();

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

      const updatesChannel = await client.channels.fetch(process.env.MAP_UPDATES_CHANNEL_ID);
      const rotationEmbed = new EmbedBuilder()
        .setTitle("BedWars Rotation Update")
        .setColor("Green")
        .setDescription(
          `**Entering:**\n- ${rotation.entering.join("\n- ")}\n\n**Leaving:**\n- ${rotation.leaving.join("\n- ")}`
        )
        .setTimestamp();

        const lastRotation = await RotationMessage.findOne({ type: "last_rotation" });
        const newRotationText = `${rotation.entering.join(",")}::${rotation.leaving.join(",")}`;
        
        if (!lastRotation || lastRotation.lastRotationText !== newRotationText) {
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
    }
  });
}

module.exports = { startPoolUpdaterCron };
