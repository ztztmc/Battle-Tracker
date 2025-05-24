const { SlashCommandBuilder, AttachmentBuilder  } = require('discord.js');
const { createCanvas, loadImage, registerFont } = require('canvas');
const axios = require('axios');
const fs = require('fs');

registerFont('./src/assets/fonts/satoshi.otf', { family: 'satoshi' });

const canvas = createCanvas(800, 500);
const ctx = canvas.getContext('2d');

const MAX_NAME_WIDTH = 420;
const BASE_FONT_SIZE = 38;
const NAME_X = 372;
const NAME_Y = 60;
const RANK_ICON_SIZE = 32;

const drawProfileCard = async (username, rank) => {
  // Load background
  const bg = await loadImage('./src/assets/profile/default_card.png');
  ctx.drawImage(bg, 0, 0);

  // Get UUID
  const uuidRes = await axios.get(`https://api.mojang.com/users/profiles/minecraft/${username}`);
  const uuid = uuidRes.data.id;

  // Draw skin
  const skin = await loadImage(`https://visage.surgeplay.com/full/430/${uuid}`);
  const cropHeight = skin.height - 81;
  ctx.drawImage(skin, 0, 0, skin.width, cropHeight, 46, 88, skin.width, cropHeight);

  let fontSize = BASE_FONT_SIZE;
  ctx.font = `${fontSize}px satoshi`;
  let nameWidth = ctx.measureText(username).width;

  if (rank) nameWidth += RANK_ICON_SIZE + 10;

  while (nameWidth > MAX_NAME_WIDTH && fontSize > 12) {
    fontSize -= 2;
    ctx.font = `${fontSize}px satoshi`;
    nameWidth = ctx.measureText(username).width + (rank ? RANK_ICON_SIZE + 10 : 0);
  }

  // Draw username
  const textGradient = ctx.createLinearGradient(0, NAME_Y, 0, NAME_Y + fontSize);
  textGradient.addColorStop(0, '#FFFFFF'); // top
  textGradient.addColorStop(1, '#575757FF'); // bottom
  ctx.fillStyle = textGradient;
  ctx.textBaseline = 'top';
  ctx.fillText(username, NAME_X, NAME_Y);

  const date = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  ctx.font = `18px satoshi`;
  ctx.fillStyle = '#6D6D6D';
  ctx.fillText(date, 34, 442);

  if (rank) {
    const rankIconPath = `./src/assets/ranks/${rank}.png`;
    if (fs.existsSync(rankIconPath)) {
      const rankImg = await loadImage(rankIconPath);
      const nameLength = ctx.measureText(username).width;
      const iconX = NAME_X + nameLength + 40;
      ctx.drawImage(rankImg, iconX, NAME_Y + 10, RANK_ICON_SIZE, RANK_ICON_SIZE);
    }
  }

  const buffer = canvas.toBuffer('image/png');
  console.log('✅ Card generated for user:', username);

  return buffer;
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('View your Battle Tracker profile.'),

  async execute(interaction) {
    await interaction.deferReply();

    const discordUsername = interaction.user.username;
    const rank = "ytlogo";

    try {
      const buffer = await drawProfileCard(discordUsername, rank);
      const attachment = new AttachmentBuilder(buffer, { name: 'profile.png' });
      
      await interaction.editReply({ files: [attachment] });
    } catch (err) {
      console.error(err);
      await interaction.editReply(`❌ Error generating profile. Please try again later.`);
    }
  }
};