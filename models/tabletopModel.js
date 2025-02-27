const mongoose = require("mongoose");

const tableTopSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  game: { type: String, required: true },
  gameMaster: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, immutable: true },
  gameMasterName: { type: String, required: true },
  players: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      playerName: { type: String, required: true },
      selectedCharacter: { type: mongoose.Schema.Types.ObjectId, ref: "Character", default: null },
      isGameMaster: { type: Boolean, default: false },
    },
  ],
  bannedPlayers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

  // ✅ Notes du MJ
  gameMasterNotes: {
    characters: { type: String, default: "" },
    quest: { type: String, default: "" },
    other: { type: String, default: "" },
    items: { type: String, default: "" },
  },

  // ✅ Notes individuelles des joueurs
  playerNotes: [
    {
      playerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      characters: { type: String, default: "" },
      quest: { type: String, default: "" },
      other: { type: String, default: "" },
      items: { type: String, default: "" },
    },
  ],

  bannerImage: { type: String, default: "" }, // 📌 Stocke l'URL de l'image de la bannière
  borderWidth: { type: String, default: "0px" },
  borderColor: { type: String, default: "#000000" },
  bannerStyle: { type: String, default: "normal" }, // "normal", "rounded", "shadow"
  
  
});


const TableTop = mongoose.model("TableTop", tableTopSchema);

module.exports = TableTop;
