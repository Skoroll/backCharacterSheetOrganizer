//acontrollers/achievementController
const Achievement = require('../models/achievementsModel');

// Fonction pour récupérer les réalisations
const getAchievements = async (req, res) => {
  try {
    const achievements = await Achievement.find({
      $or: [
        { user: req.user._id },
        { isGlobal: true }
      ]
    }).lean();
    achievements.map(achievement => {
      achievement.id = achievement._id;
      delete achievement._id; // Retirer _id original
    });
    res.status(200).json(achievements);
  } catch (error) {
    console.error('Erreur lors de la récupération des réalisations:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
};

module.exports = { getAchievements };
