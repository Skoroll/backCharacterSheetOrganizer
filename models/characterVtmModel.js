const mongoose = require("mongoose");

const characterVtmSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  clan: { type: String },
  generation: { type: Number },
  attributes: {
    strength: Number,
    dexterity: Number,
    stamina: Number,
    charisma: Number,
    manipulation: Number,
    appearance: Number,
    perception: Number,
    intelligence: Number,
    wits: Number,
  },
  abilities: {
    alertness: Number,
    athletics: Number,
    brawl: Number,
    empathy: Number,
    expression: Number,
    intimidation: Number,
    subterfuge: Number,
    stealth: Number,
    etc: Number // à compléter selon tes besoins
  },
  disciplines: [String],
  background: { type: String },
  willpower: { type: Number },
  bloodPool: { type: Number },
  humanity: { type: Number },
  inventory: [String],
  notes: String,
  tableIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "TableTop" }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("CharacterVtm", characterVtmSchema);
