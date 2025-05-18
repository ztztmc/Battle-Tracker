require("dotenv").config();
const mongoose = require("mongoose");
const CurrentPool = require("../models/currentPool");

const initialMaps = [
  "Arcade",
  "Lighthouse",
  "Lightstone",
  "Mirage",
  "Nebuc",
  "Slumber",
  "Vigilante",
  "Yue",
  "Duye",
  "Acropolis",
  "Aetius",
  "Arid",
  "Cascade",
  "Casita",
  "Dragon Light",
  "Highland Peaks",
  "Keep",
  "Lotus",
  "Orbit",
  "Pavilion",
  "Pernicious",
  "Playground",
  "Rooted",
  "Siege",
  "Silver Birch",
  "Snails",
  "Speedway",
  "Terraced"
];

async function seedInitialMaps() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Check if data already exists
    const existing = await CurrentPool.findOne();
    if (existing) {
      console.log("Initial map pool already exists.");
      return;
    }

    await CurrentPool.create({ maps: initialMaps });
    console.log("Initial map pool saved successfully.");
  } catch (e) {
    console.error("Error seeding initial maps:", e);
  } finally {
    mongoose.connection.close();
  }
}

seedInitialMaps();
