require('dotenv').config();
const cron = require("node-cron");
const RotationMessage = require("../models/rotationMessage.js");
//const { fetchMapRotation } = require("../utils/fetchRotation.js");
const { fetchPolsuMapPool } = require("../utils/fetchPolsuPool.js");
const { EmbedBuilder } = require("discord.js");

async function startRotationCron(client) {
  // Runs every day at 8 AM UTC
  //cron.schedule("0 8 * * *", async () => {
    const updatesChannel = await client.channels.fetch(process.env.MAP_UPDATES_CHANNEL_ID);
    const poolChannel = await client.channels.fetch(process.env.MAP_POOL_CHANNEL_ID);
    const existing = await RotationMessage.findOne({ type: "map_pool" });

    // STEP 1: Update map pool using Polsu
    const polsuMapPool = await fetchPolsuMapPool();
    if (!polsuMapPool) return;
    console.log("Polsu map pool fetched successfully." + polsuMapPool);
    const poolEmbed = new EmbedBuilder()
      .setTitle("Current BedWars Map Pool")
      .setColor("Green")
      .setDescription(polsuMapPool)
      .setTimestamp();

    if (!existing || existing.lastRotationText !== polsuMapPool) {
      // Delete old pool message
      if (existing?.messageId) {
        try {
          const oldMsg = await poolChannel.messages.fetch(existing.messageId);
          if (oldMsg) await oldMsg.delete();
        } catch (e) {
          console.warn("Could not delete old message:", e);
        }
      }

      // Send new pool message
      const poolMsg = await poolChannel.send({ embeds: [poolEmbed] });

      // Save message id and text to db
      if (!existing) {
        await RotationMessage.create({
          type: "map_pool",
          messageId: poolMsg.id,
          lastRotationText: polsuMapPool
        });
      } else {
        existing.messageId = poolMsg.id;
        existing.lastRotationText = polsuMapPool;
        await existing.save();
      }
    }
    console.log("Updated map pool message.");

    // STEP 2: Check for new rotation updates (using your original method)
    //const rotation = await fetchMapRotation();
    //if (!rotation) return;

    //const enteringText = rotation.entering.join("\n- ");
    //const leavingText = rotation.leaving.join("\n- ");
    //const fullText = `**Entering Rotation:**\n- ${enteringText}\n\n**Leaving Rotation:**\n- ${leavingText}`;

    //const updateEmbed = new EmbedBuilder()
      //.setTitle("BedWars Map Rotation Update")
      //.setColor("Green")
      //.setDescription(fullText)
      //.setTimestamp();

    //await updatesChannel.send({ embeds: [updateEmbed] });
  //});
}

module.exports = { startRotationCron };
