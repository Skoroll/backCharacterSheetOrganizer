//routes/achievementRoutes.js
const express = require('express');
const { protect } = require('../middlewares/authMiddleware');
const Achievement = require('../models/achievementsModel');
const { getAchievements } = require('../controllers/achievementController'); 

const router = express.Router();

// Route pour récupérer toutes les réalisations (publiques + privées)
router.get("/", protect, async (req, res) => {
    try {
      const userId = req.user._id; // Utiliser l'utilisateur authentifié
        
      // Chercher les succès pour l'utilisateur ou globaux
      const achievements = await Achievement.find({
        $or: [
          { user: userId },
          { isGlobal: true }
        ]
      }).lean();
      
      // Mapper _id vers id
      achievements.map(achievement => {
        achievement.id = achievement._id;
        delete achievement._id;  // Supprimer _id original
      });
  
      res.status(200).json(achievements); // Réponse avec les succès
      
    } catch (error) {
      console.error("Erreur lors de la récupération des tâches :", error);
      res.status(500).json({ message: "Erreur lors de la récupération des tâches." });
    }
  });
  

// Valider une tâche (marquer comme terminée)
router.put('/:achievemenstId/done', protect, async (req, res) => {
  try {
    const achievement = await Achievement.findById(req.params.achievementId);
    if (!achievement) {
      return res.status(404).json({ message: 'Tâche non trouvée' });
    }

    achievement.isDone = true;
    achievement.lastCompleted = new Date();
    achievement.nextDue = calculateNextDueDate(achievement.frequency); // Calculer la prochaine échéance selon la fréquence
    await achievement.save();

    res.status(200).json({ message: 'Tâche marquée comme terminée', achievement });
  } catch (error) {
    console.error("Erreur lors de la validation de la tâche :", error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour de la tâche', error });
  }
});


// Route pour récupérer toutes les tâches globales (publiques)
router.get("/global", async (req, res) => {
  try {
    const achievements = await Achievement.find({ isGlobal: true }); // Récupérer toutes les tâches globales
    res.status(200).json(achievements);
  } catch (error) {
    console.error("Erreur lors de la récupération des tâches globales :", error);
    res.status(500).json({ message: "Erreur lors de la récupération des tâches globales." });
  }
});

// Route pour récupérer les tâches par pièce pour un utilisateur spécifique
router.get("/by-room", protect, async (req, res) => {
  try {
    const userId = req.user._id; // Utiliser l'utilisateur authentifié
    const rooms = req.query.rooms.split(","); // Récupérer les pièces via les paramètres de requête

    // Trouver les tâches en fonction des pièces spécifiées
    const achievements = await Achievement.find({
      $or: [
        { user: userId, room: { $in: rooms } }, // Tâches privées liées à l'utilisateur et filtrées par pièce
        { isGlobal: true, room: { $in: rooms } }  // Tâches globales visibles par tous et filtrées par pièce
      ]
    });

    res.status(200).json(achievements);
  } catch (error) {
    console.error("Erreur lors de la récupération des tâches par pièce :", error);
    res.status(500).json({ message: "Erreur lors de la récupération des tâches par pièce." });
  }
});


// Route pour mettre à jour une tâche
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { isDone } = req.body;

  try {
    const updatedAchievement = await Achievement.findByIdAndUpdate(
      id,
      { isDone },
      { new: true }
    );
    if (!updatedAchievement) {
      return res.status(404).send({ message: "Tâche non trouvée." });
    }
    res.send(updatedAchievement);
  } catch (error) {
    res.status(500).send({ message: "Erreur serveur." });
  }
});

// Route pour récupérer uniquement les tâches terminées par pièce
router.get("/completed", protect, async (req, res) => {
  try {
    const userId = req.user._id; // Utiliser l'utilisateur authentifié
    const rooms = req.query.rooms.split(","); // Récupérer les pièces via les paramètres de requête

    // Trouver les tâches terminées par utilisateur et filtrées par pièce
    const achievements = await Achievement.find({
      $or: [
        { user: userId, isDone: true, room: { $in: rooms } }, // Tâches terminées de l'utilisateur, filtrées par pièce
        { isGlobal: true, isDone: true, room: { $in: rooms } }  // Tâches globales terminées visibles par tous, filtrées par pièce
      ]
    });

    res.status(200).json(achievements);
  } catch (error) {
    console.error("Erreur lors de la récupération des tâches terminées :", error);
    res.status(500).json({ message: "Erreur lors de la récupération des tâches terminées." });
  }
});




module.exports = router;
