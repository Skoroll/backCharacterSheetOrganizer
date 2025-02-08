const mongoose = require("mongoose");

const gameMasterNotesSchema = new mongoose.Schema({
  characters: { type: String, default: "" },
  quest: { type: String, default: "" },
  other: { type: String, default: "" },
  items: { type: String, default: "" },
});

const playerSchema = new mongoose.Schema({
  playerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
  playerName: String,
  selectedCharacter: { type: mongoose.Schema.Types.ObjectId, ref: 'Character' }, // Ajout de selectedCharacter
});

const tableTopSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  gameMaster: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    immutable: true,
  },
  gameMasterName: {
    type: String,
    required: true,
  },
  players: [playerSchema],
  gameMasterNotes: {
    type: gameMasterNotesSchema, // Utilisation du sous-schéma
    default: {}, // Par défaut, l'objet est vide
  },
});

const TableTop = mongoose.model("TableTop", tableTopSchema);
module.exports = TableTop;
