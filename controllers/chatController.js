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
      // Créer un nouveau message
      const newMessage = new Message({
        message,
        characterName,
        senderName,
        tableId,
      });
  
      // Sauvegarder le message
      await newMessage.save();
  
      // Limiter à 20 messages (on garde les plus récents)
      const messageCount = await Message.countDocuments({ tableId });
  
      if (messageCount > 20) {
        // Si plus de 20 messages, supprimer les plus anciens
        const oldestMessages = await Message.find({ tableId })
          .sort({ createdAt: 1 }) // Tri par date croissante (les plus anciens en premier)
          .limit(messageCount - 20); // Garde 20 messages et supprime le reste
        const oldestMessageIds = oldestMessages.map(msg => msg._id);
        await Message.deleteMany({ _id: { $in: oldestMessageIds } }); // Supprimer les messages les plus anciens
      }
  
      res.status(201).json(newMessage); // Renvoie le message sauvegardé
    } catch (err) {
      res.status(500).json({ message: "Erreur lors de l'envoi du message", error: err });
    }
  };
  

module.exports = { getMessages, postMessage };
