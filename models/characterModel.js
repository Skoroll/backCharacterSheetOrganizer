import mongoose from "mongoose";

const { Schema, model } = mongoose;

// Schéma pour une arme
const WeaponSchema = new Schema({
  name: { type: String, required: true },
  damage: { type: String, required: true },
});

// Schéma pour une compétence spéciale
const SkillSchema = new Schema({
  specialSkill: { type: String },
  link1: { type: String },
  link2: { type: String },
  score: { type: String },
});

// Schéma pour un objet d'inventaire
const InventoryItemSchema = new Schema({
  item: { type: String },
  quantity: { type: String },
});

// Schéma principal du personnage
const CharacterSchema = new Schema({
  image: { type: String, required: true }, // URL de l'image stockée
  className: { type: String, required: true },
  name: { type: String, required: true },
  age: { type: Number, required: true },
  strength: { type: Number, required: true },
  dexterity: { type: Number, required: true },
  endurance: { type: Number, required: true },
  intelligence: { type: Number, required: true },
  charisma: { type: Number, required: true },
  weapons: { type: [WeaponSchema], required: true, validate: v => v.length > 0 }, // Minimum 1 arme
  pointsOfLife: { type: Number, required: true },
  injuries: { type: Number, required: true },
  protection: { type: Number, required: true },
  skills: { type: [SkillSchema], default: [] }, // Facultatif
  inventory: { type: [InventoryItemSchema], default: [] }, // Facultatif
  background: { type: String, required: true },
});

export default model("Character", CharacterSchema);
