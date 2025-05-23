const Character = require("../models/characterModel");
const User = require("../models/userModel");

const checkCharacterLimit = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ message: "Utilisateur non trouvé." });
    }

    // Les premium n'ont pas de limite
    if (user.isPremium) return next();

    const count = await Character.countDocuments({ userId });

    if (count >= 3) {
      return res.status(403).json({
        message: "Limite de 3 personnages atteinte pour les comptes gratuits.",
      });
    }

    next();
  } catch (error) {
    console.error("Erreur dans checkCharacterLimit:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

module.exports = checkCharacterLimit;
