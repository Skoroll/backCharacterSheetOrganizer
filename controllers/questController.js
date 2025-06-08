const Quest = require("../models/quest");
const User = require("../models/userModel");

exports.createQuest = async (req, res) => {
  try {
    const { name, type, details, rewards, game } = req.body;
    const userId = req.user.id;

    const newQuest = await Quest.create({
      name,
      type,
      details,
      rewards,
      game,
      creator: userId,
    });

    await User.findByIdAndUpdate(userId, { $push: { userQuest: newQuest._id } });

    res.status(201).json({ message: "Quête créée", quest: newQuest });
  } catch (error) {
    console.error("Erreur création quête :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.getUserQuests = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId)
      .populate("userQuest")
      .populate("addedQuest");

    res.json({
      userQuest: user.userQuest,
      addedQuest: user.addedQuest,
    });
  } catch (error) {
    console.error("Erreur récupération quêtes :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
