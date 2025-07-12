const { SlashCommandBuilder, AttachmentBuilder } = require("discord.js");
const { createCanvas, loadImage, registerFont } = require("canvas");
const axios = require("axios");
const PlayerSchema = require("../../models/player/player.js");

registerFont("./src/assets/fonts/satoshi.otf", { family: "satoshi" });

const canvas = createCanvas(800, 500);
const ctx = canvas.getContext("2d");

const MAX_NAME_WIDTH = 420;
const BASE_FONT_SIZE = 38;
const NAME_X = 372;
const NAME_Y = 61;
const RANK_ICON_SIZE = 32;

const drawProfileCard = async (username, player) => {
  // Load background
  const bg = await loadImage("./src/assets/profile/default_card.png");
  ctx.drawImage(bg, 0, 0);

  // Get UUID
  const uuidRes = await axios.get(
    `https://api.mojang.com/users/profiles/minecraft/${username}`
  );
  const uuid = uuidRes.data.id;

  // Draw skin
  const skin = await loadImage(`https://visage.surgeplay.com/full/430/${uuid}`);
  const cropHeight = skin.height - 81;
  ctx.drawImage(
    skin,
    0,
    0,
    skin.width,
    cropHeight,
    46,
    88,
    skin.width,
    cropHeight
  );

  let fontSize = BASE_FONT_SIZE;
  ctx.font = `${fontSize}px satoshi`;
  let nameWidth = ctx.measureText(username).width;

  //if (rank) nameWidth += RANK_ICON_SIZE + 10;

  while (nameWidth > MAX_NAME_WIDTH && fontSize > 12) {
    fontSize -= 2;
    ctx.font = `${fontSize}px satoshi`;
    // nameWidth =
    //   ctx.measureText(username).width + (rank ? RANK_ICON_SIZE + 10 : 0);
    nameWidth = ctx.measureText(username).width;
  }

  // Draw username
  const textGradient = ctx.createLinearGradient(
    0,
    NAME_Y,
    0,
    NAME_Y + fontSize
  );
  textGradient.addColorStop(0, "#FFFFFF"); // top
  textGradient.addColorStop(1, "#575757FF"); // bottom
  ctx.fillStyle = textGradient;
  ctx.textBaseline = "top";
  ctx.fillText(username, NAME_X, NAME_Y);

  const date = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  ctx.font = `18px satoshi`;
  ctx.fillStyle = "#6D6D6D";
  ctx.fillText(date, 34, 442);

  // Draw stats
  const points = player.points || 0;
  let rank = player.rank || "?";
  const gamesSubmitted = player.totalGamesSubmitted || 0;
  const fastestTime = player.fastestGameTime || "-";
  if (rank == -1) {
    rank = "-";
  }
  ctx.font = `54px satoshi`;
  ctx.fillStyle = "#a6d3a6ff";
  drawCenteredText(ctx, points.toString(), 455, 175);
  drawCenteredText(ctx, rank.toString(), 672, 175);
  drawCenteredText(ctx, gamesSubmitted.toString(), 455, 350);
  drawCenteredText(ctx, fastestTime.toString(), 672, 350);

  // if (rank) {
  //   const rankIconPath = `./src/assets/ranks/${rank}.png`;
  //   if (fs.existsSync(rankIconPath)) {
  //     const rankImg = await loadImage(rankIconPath);
  //     const nameLength = ctx.measureText(username).width;
  //     const iconX = NAME_X + nameLength + 40;
  //     ctx.drawImage(
  //       rankImg,
  //       iconX,
  //       NAME_Y + 10,
  //       RANK_ICON_SIZE,
  //       RANK_ICON_SIZE
  //     );
  //   }
  // }

  const buffer = canvas.toBuffer("image/png");
  console.log("✅ Card generated for user:", username);

  return buffer;
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("profile")
    .setDescription("View your Battle Tracker profile."),

  async execute(interaction) {
    await interaction.deferReply();

    const userId = interaction.user.id;
    const registeredPlayer = await PlayerSchema.findOne({ userId });
    if (!registeredPlayer) {
      const notRegisteredEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription(
          `### ${process.env.ICON_BLOCK} **You are not registered**\n\nUse </register:1373217367433285705> in <#1375877348464791643>`
        );

      await interaction.editReply({
        embeds: [notRegisteredEmbed],
      });

      return;
    }

    const discordUsername = interaction.user.username;
    //implement ranks in the future
    //const rank = "ytlogo";

    try {
      const buffer = await drawProfileCard(
        discordUsername,
        //rank,
        registeredPlayer
      );
      const attachment = new AttachmentBuilder(buffer, { name: "profile.png" });

      await interaction.editReply({ files: [attachment] });
    } catch (err) {
      console.error(err);
      await interaction.editReply(
        `❌ Error generating profile. Please try again later.`
      );
    }
  },
};

function drawCenteredText(ctx, text, centerX, y) {
  const textWidth = ctx.measureText(text).width;
  ctx.fillText(text, centerX - textWidth / 2, y);
}
