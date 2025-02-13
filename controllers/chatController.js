const Message = require("../models/Message");

// Récupérer les 20 derniers messages pour une table spécifique
const getMessages = async (req, res) => {
  const { tableId } = req.query; // Récupère le tableId depuis la requête

  try {
    const messages = await Message.find({ tableId }) // Assure-toi de filtrer par tableId
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(messages); // Renvoie les messages au format JSON
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la récupération des messages", error: err });
  }
};

// Envoyer un nouveau message à une table spécifique
const postMessage = async (req, res) => {
  const { message, characterName, senderName, tableId } = req.body;

  try {
    const newMessage = new Message({
      message,
      characterName,
      senderName,
      tableId, // Assure-toi que tableId est bien sauvegardé
    });
    await newMessage.save();
    res.status(201).json(newMessage); // Renvoie le message sauvegardé
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de l'envoi du message", error: err });
  }
};

module.exports = { getMessages, postMessage };
