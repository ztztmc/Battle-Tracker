const axios = require("axios");
const { DOMParser } = require('xmldom');

async function fetchMapRotation() {
  const response = await axios.get("https://script.googleusercontent.com/macros/echo?user_content_key=2Ai4v3KYqbWnohMffVmAIzW5DHQSfvOM_qpgagZsdm20FytKFrVWBaUa_BP-4x_Jcjbz0441xPIGe8SAHcGWCKlqgzoDdVrUm5_BxDlH2jW0nuo2oDemN9CCS2h10ox_1xSncGQajx_ryfhECjZEnEWVv3jx8tM0OiqG-51JWCyIMy7n_pH0PhdzAZd11i11WvG9kd4SzEqyA9oeH_nq4IijXrNOrXbysxi-Uln92Pm-CYj1To_B6tz9Jw9Md8uu&lib=MruAlH_ZlrSrpVZ_WsTbwDkatsAr8pJY9", {
    headers: {
      "Content-Type": "application/json"
    }
  });
  const html = await response.data;
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const bbWrappers = doc.querySelectorAll(".bbWrapper");
  const latestPost = bbWrappers[bbWrappers.length - 1];

  if (!latestPost) return null;

  const rows = latestPost.querySelectorAll("tr");

  const enteringMaps = [];
  const leavingMaps = [];

  rows.forEach(row => {
    const cells = row.querySelectorAll("td");
    if (cells.length === 2) {
      const leftMap = cells[0].textContent.trim();
      const rightMap = cells[1].textContent.trim();

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