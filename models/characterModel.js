const mongoose = require('mongoose');

// 🔄 D'abord, le magicSchema
const magicSchema = new mongoose.Schema({
  ariaMagic: { type: Boolean, default: false },
  deathMagic: { type: Boolean, default: false },
  deathMagicMax: { type: Number, default: 10, min: 0 },
  deathMagicCount: {
    type: Number,
    default: 0,
    min: 0,
    validate: {
      validator: function (value) {
        return value <= this.deathMagicMax;
      },
      message: "deathMagicCount ne peut pas dépasser deathMagicMax.",
    },
  },
});

// Ensuite, le characterSchema
const characterSchema = new mongoose.Schema({
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
  baseSkills: [{
    name: { type: String, required: true },
    link1: { type: String, required: true },
    link2: { type: String, required: true },
    bonusMalus: { type: Number, default: 0 }
  }],
  skills: [{
    specialSkill: { type: String },
    link1: { type: String },
    link2: { type: String },
    score: { type: Number },
    bonusMalus: { type: Number, default: 0 }
  }],
  weapons: [{
    name: { type: String },
    damage: { type: String }
  }],
  inventory: [{
    item: { type: String },
    quantity: { type: Number }
  }],
  magic: { type: magicSchema, default: () => ({}) },
  image: { type: String },
  tableIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "TableTop" }],
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
});

// Pour gérer les anciens documents qui n’ont pas le champ magic
characterSchema.pre("save", function (next) {
  if (!this.magic || typeof this.magic !== "object") {
    this.magic = {
      ariaMagic: false,
      deathMagic: false,
      deathMagicCount: 0,
      deathMagicMax: 10,
    };
  }
  next();
});

const Character = mongoose.model('Character', characterSchema);
module.exports = Character;
