require('dotenv').config();
const axios = require("axios");

async function fetchPolsuMapPool() {
  try {
    const options = {
      method: 'GET',
      url: 'https://api.polsu.xyz/polsu/bedwars/maps',
      headers: {'API-Key': process.env.POLSU_API_KEY},
    };
    const { data } = await axios.request(options);

    const maps = data.data.formatted || [];

    const formatted = maps.map(map => `- ${map}`).join("\n");

    return formatted;
  } catch (e) {
    console.error("Error fetching Polsu map pool:", e.response?.data || e.message);
    return null;
  }
}

module.exports = { fetchPolsuMapPool };