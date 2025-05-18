const axios = require("axios");
const cheerio = require("cheerio");

async function fetchMapRotation() {
  const response = await axios.get("https://script.googleusercontent.com/macros/echo?user_content_key=2Ai4v3KYqbWnohMffVmAIzW5DHQSfvOM_qpgagZsdm20FytKFrVWBaUa_BP-4x_Jcjbz0441xPIGe8SAHcGWCKlqgzoDdVrUm5_BxDlH2jW0nuo2oDemN9CCS2h10ox_1xSncGQajx_ryfhECjZEnEWVv3jx8tM0OiqG-51JWCyIMy7n_pH0PhdzAZd11i11WvG9kd4SzEqyA9oeH_nq4IijXrNOrXbysxi-Uln92Pm-CYj1To_B6tz9Jw9Md8uu&lib=MruAlH_ZlrSrpVZ_WsTbwDkatsAr8pJY9", {
    headers: {
      "Content-Type": "application/json"
    }
  });

  const html = response.data;
  const $ = cheerio.load(html);

  const bbWrappers = $(".bbWrapper");
  const latestPost = bbWrappers.last();

  if (!latestPost) return null;

  const enteringMaps = [];
  const leavingMaps = [];

  $(latestPost).find("tr").each((_, row) => {
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
    leaving: leavingMaps
  };
}

module.exports = { fetchMapRotation };
