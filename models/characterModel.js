// models/Character.js
import mongoose from 'mongoose';

const characterSchema = new mongoose.Schema({
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
  origin: { type: String, required: true },

  // Champs optionnels pour les armes, compétences et inventaire
  weapons: [{
    name: { type: String, required: false },
    damage: { type: String, required: false }
  }],
  skills: [{
    specialSkill: { type: String, required: false },
    link1: { type: String, required: false },
    link2: { type: String, required: false },
    score: { type: Number, required: false }
  }],
  inventory: [{
    item: { type: String, required: false },
    quantity: { type: Number, required: false }
  }],
  image: { type: String, required: false },

  // Associer le personnage à un utilisateur
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
});

const Character = mongoose.model('Character', characterSchema);
export default Character;
