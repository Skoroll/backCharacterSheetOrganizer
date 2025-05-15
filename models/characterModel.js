const mongoose = require("mongoose");
const shuffleDeck = require("../utils/shuffleDeckAria");

// Schema des magies
const magicSchema = new mongoose.Schema({
  ariaMagic: { type: Boolean, default: false },
  ariaMagicLevel: {
    type: Number,
    enum: [1, 2, 3],
    default: 1,
  },
  deathMagic: { type: Boolean, default: false },
  deathMagicMax: { type: Number, default: 10, min: 0 },
  deathMagicCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  ariaMagicCards: { type: [String], default: [] },
  ariaMagicUsedCards: { type: [String], default: [] },  
});

// Schema du personnages
const characterSchema = new mongoose.Schema({
  selectedFrame: {type: String, default : null },
  game: { type: String, required: true },
  name: { type: String, required: true },
  className: { type: String, required: true },
  age: { type: Number, required: true },
  strength: { type: Number, required: true },
  dexterity: { type: Number, required: true },
  endurance: { type: Number, required: true },
  intelligence: { type: Number, required: true },
  charisma: { type: Number, required: true },
  pointsOfLife: { type: Number, required: true },
  gold: { type: Number, required: true },
  injuries: { type: String, required: true },
  protection: { type: String, required: true },
  background: { type: String, required: true },
  cons: { type: String, required: true },
  pros: { type: String, required: true },
  origin: { type: String, required: true },
  baseSkills: [
    {
      name: { type: String, required: true },
      link1: { type: String, required: true },
      link2: { type: String, required: true },
      bonusMalus: { type: Number, default: 0 },
    },
  ],
  skills: [
    {
      specialSkill: { type: String },
      link1: { type: String },
      link2: { type: String },
      score: { type: Number },
      bonusMalus: { type: Number, default: 0 },
    },
  ],
  weapons: [
    {
      name: { type: String },
      damage: { type: String },
    },
  ],
  inventory: [
    {
      item: { type: String },
      quantity: { type: Number },
    },
  ],
  magic: { type: magicSchema, default: () => ({}) },
  image: { type: String },
  tableIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "TableTop" }],
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
});

characterSchema.pre("validate", function (next) {
  // Initialise les cartes d'Aria si activé et si le deck est vide
  if (this.magic?.ariaMagic && (!this.magic.ariaMagicCards || this.magic.ariaMagicCards.length === 0)) {
    this.magic.ariaMagicCards = shuffleDeck(); // deck de 52 cartes mélangé
    this.magic.ariaMagicUsedCards = [];
  }

  // Protection au cas où les champs ne seraient pas définis du tout
  if (!this.magic) {
    this.magic = {
      ariaMagic: false,
      deathMagic: false,
      deathMagicCount: 0,
      deathMagicMax: 10,
      ariaMagicCards: [],
      ariaMagicUsedCards: [],
    };
  }

  next();
});

const Character = mongoose.model("Character", characterSchema);
module.exports = Character;
