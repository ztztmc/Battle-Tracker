const axios = require("axios");
const cheerio = require("cheerio");

async function fetchMapRotation() {
  const response = await axios.get(
    "https://script.googleusercontent.com/macros/echo?user_content_key=AehSKLhFxS2psT77Z-avcM39zVi4YSxHwyoVr5jJeBjeVRPvLgZBIGaprOHQVerNZsmqbYlwMMvSa3DHeYRvw9BQ09TBg0YQE-2wk_IExLBBrnHtAaQCZnDQD9eBfsF7D_P7jhbysmUSu__P4hmt_gw2UHmtG2kGB2ZWxzIABYiT9GeaiCPTovE3Z9nFoj08VhL1e23KVmXD_lXf63beuU_Zge4oNPFjAR--lFTcYs-5xSlIVrvrKsFQsHRj17r3id5YMs0lpRQNM2XD0GQncY4QKOm05YqxtPxNtzwrqWU4&lib=MruAlH_ZlrSrpVZ_WsTbwDkatsAr8pJY9",
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  const html = response.data;
  const $ = cheerio.load(html);

  const bbWrappers = $(".bbWrapper");
  const latestPost = bbWrappers.last();

  if (!latestPost) return null;

  const enteringMaps = [];
  const leavingMaps = [];

  $(latestPost)
    .find("tr")
    .each((_, row) => {
      const cells = $(row).find("td");
      if (cells.length === 2) {
        const leftMap = $(cells[0]).text().trim();
        const rightMap = $(cells[1]).text().trim();

        if (leftMap) enteringMaps.push(leftMap);
        if (rightMap) leavingMaps.push(rightMap);
      }
    });

  return {
    entering: enteringMaps,
    leaving: leavingMaps,
  };
}

module.exports = { fetchMapRotation };
