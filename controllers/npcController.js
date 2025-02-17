const Npc = require("../models/npcModel");

// 📌 Créer un PNJ
exports.createNpc = async (req, res) => {
  try {
    const { tableId, type, name, age, strength, dexterity, intelligence, charisma, endurance, inventory, specialSkills, story } = req.body;

    if (!tableId) {
      return res.status(400).json({ message: "L'ID de la table est requis." });
    }

    const npc = new Npc({
      tableId,
      type,
      name,
      age,
      strength,
      dexterity,
      intelligence,
      charisma,
      endurance,
      inventory,
      specialSkills,
      story,
    });

    await npc.save();
    res.status(201).json(npc);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la création du PNJ", error });
  }
};

// 📌 Récupérer les PNJs d'une table
exports.getNpcsByTable = async (req, res) => {
  try {
    const { tableId } = req.params;

    if (!tableId) {
      return res.status(400).json({ message: "L'ID de la table est requis." });
    }

    const npcs = await Npc.find({ tableId });
    res.json(npcs);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération des PNJs", error });
  }
};


// Supprimer un PNJ par son _id
exports.deleteNpc = async (req, res) => {
  try {
    const { id } = req.params; // Récupère l'ID du PNJ
    const deletedNpc = await Npc.findByIdAndDelete(id);

    if (!deletedNpc) {
      return res.status(404).json({ message: "PNJ non trouvé" });
    }

    res.status(200).json({ message: "PNJ supprimé avec succès" });
  } catch (error) {
    console.error("❌ Erreur lors de la suppression du PNJ :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};