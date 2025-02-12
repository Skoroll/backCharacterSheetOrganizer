const mongoose = require("mongoose");

// Définir un schéma pour les notes du Game Master
const gameMasterNotesSchema = new mongoose.Schema({
  notes: { type: String, default: "" }, // Par exemple, une propriété 'notes' de type String
  // Ajoutez d'autres propriétés si nécessaire pour vos notes
});

// Définir le schéma des joueurs
const playerSchema = new mongoose.Schema({
  playerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  playerName: String,
  selectedCharacter: { type: mongoose.Schema.Types.ObjectId, ref: 'Character' },
  isGameMaster: { type: Boolean, default: false },
});

// Définir le schéma des tables
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
  game : {
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
    type: gameMasterNotesSchema, // Référence au schéma des notes du game master
    default: {}, // Valeur par défaut vide
  },
});



// Créer le modèle pour TableTop
const TableTop = mongoose.model("TableTop", tableTopSchema);

module.exports = TableTop;
