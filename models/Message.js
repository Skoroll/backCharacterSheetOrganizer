const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  message: { type: String, required: true },
  characterName: { type: String, required: true }, // Nom du personnage est obligatoire
  senderName: { type: String, required: false }, // Le pseudo du joueur est optionnel
  tableId: { type: String, required: true }, // Ajouter tableId pour associer les messages à une table
  isPremium: Boolean,
  createdAt: { type: Date, default: Date.now, expires: '2d' }, // Expiration automatique après 2 jours
});

const Message = mongoose.model("Message", messageSchema);

module.exports = Message;
