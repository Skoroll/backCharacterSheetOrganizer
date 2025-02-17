const mongoose = require("mongoose");

const NpcSchema = new mongoose.Schema({
  tableId: { type: mongoose.Schema.Types.ObjectId, ref: "Table", required: true },
  type: { type: String, enum: ["Friendly", "Hostile"], required: true },
  name: { type: String, required: true },
  age: { type: Number, required: false },
  strength: { type: Number, required: false },
  dexterity: { type: Number, required: false },
  intelligence: { type: Number, required: false },
  charisma: { type: Number, required: false },
  endurance: { type: Number, required: false },
  inventory: [{ item: String, quantity: Number }],
  specialSkills: [{ name: String, score: Number }],
  story: { type: String, required: false },
});

module.exports = mongoose.model("Npc", NpcSchema);
