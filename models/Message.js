// models/Message.js
const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  pseudo: { type: String, required: true },
  message: { type: String, required: true },
  characterName: { type: String, required: true }, // Champ pour le nom du personnage
  createdAt: { type: Date, default: Date.now, expires: '2d' }, // Expiration automatique après 2 jours
});

const Message = mongoose.model("Message", messageSchema);

module.exports = Message;
