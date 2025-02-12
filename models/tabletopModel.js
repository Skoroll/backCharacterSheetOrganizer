const mongoose = require("mongoose");

// Définition du schéma des joueurs
const playerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // ID réel du joueur
  playerName: { type: String, required: true }, // Nom du joueur
  selectedCharacter: { type: mongoose.Schema.Types.ObjectId, ref: "Character", default: null }, // Personnage sélectionné
  isGameMaster: { type: Boolean, default: false }, // Est-ce le MJ ?
});

// Définition du schéma des tables
const tableTopSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // Nom de la table
  password: { type: String, required: true }, // Mot de passe sécurisé (haché)
  game: { type: String, required: true }, // Nom du jeu
  gameMaster: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, immutable: true }, // ID du MJ
  gameMasterName: { type: String, required: true }, // Nom du MJ
  players: [playerSchema], // Liste des joueurs
  bannedPlayers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Liste des joueurs bannis
  gameMasterNotes: {
    characters: { type: String, default: "" },
    quest: { type: String, default: "" },
    other: { type: String, default: "" },
    items: { type: String, default: "" }
  }
});

const TableTop = mongoose.model("TableTop", tableTopSchema);

module.exports = TableTop;
