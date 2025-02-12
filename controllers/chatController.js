// controllers/chatController.js
const Message = require("../models/Message");

// Récupérer les 20 derniers messages
const getMessages = async (req, res) => {
  try {
    const messages = await Message.find()
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la récupération des messages", error: err });
  }
};

// Envoyer un nouveau message
const postMessage = async (req, res) => {
  const { pseudo, message, characterName } = req.body;

  if (!pseudo || !message || !characterName) {
    return res.status(400).json({ message: "Tous les champs sont nécessaires" });
  }

  try {
    const newMessage = new Message({
      pseudo,
      message,
      characterName,
    });
    await newMessage.save();
    res.status(201).json(newMessage);
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de l'envoi du message", error: err });
  }
};

module.exports = { getMessages, postMessage };
