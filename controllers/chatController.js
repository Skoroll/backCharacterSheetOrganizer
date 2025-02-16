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
  
exports.updateHealth = async (req, res) => {
  try {
    const { pointsOfLife } = req.body;
    const character = await Character.findByIdAndUpdate(
      req.params.id,
      { pointsOfLife },
      { new: true }
    );

    if (!character) {
      return res.status(404).json({ message: "Personnage non trouvé" });
    }

    // 📢 Notifier tous les joueurs via WebSocket
    const io = req.app.get("io");
    io.to(`table-${character.tableId}`).emit("updateHealth", {
      characterId: character._id,
      pointsOfLife: character.pointsOfLife
    });

    // 📝 Enregistrer l'événement dans le chat
    const systemMessage = new Message({
      message: `${character.name} change ses points de vie en : ${character.pointsOfLife}`,
      characterName: "Système",
      senderName: "Système",
      tableId: character.tableId,
    });

    await systemMessage.save(); // Sauvegarde en base

    // 📢 Envoyer aussi via WebSocket aux autres joueurs
    io.to(`table-${character.tableId}`).emit("newMessage", systemMessage);

    res.json(character);
  } catch (error) {
    console.error("❌ Erreur mise à jour des PV :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
module.exports = { getMessages, postMessage };
