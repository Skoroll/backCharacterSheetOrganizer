const mongoose = require("mongoose");
const Character = require("../models/Character");

const MONGODB_URI = "mongodb+srv://..."; // remplace par ton URI Mongo

async function migrate() {
  await mongoose.connect(MONGODB_URI);
  const characters = await Character.find({ magic: { $exists: false } });

  for (const char of characters) {
    char.magic = {
      ariaMagic: char.ariaMagic ?? false,
      deathMagic: false,
      deathMagicCount: 0,
      deathMagicMax: 10,
    };
    delete char.ariaMagic; // supprime l'ancien champ
    await char.save();

  }

  await mongoose.disconnect();
  console.log("Migration terminée.");
}

migrate().catch((err) => {
  console.error("Erreur :", err);
  process.exit(1);
});
