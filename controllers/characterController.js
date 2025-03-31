const Character = require("../models/characterModel");
const TableTop = require("../models/tabletopModel");
const Message = require("../models/Message");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");

// 📌 Créer un personnage avec image
const createCharacter = async (req, res) => {
  try {
    const {
      game,
      name,
      age,
      className,
      strength,
      dexterity,
      endurance,
      intelligence,
      charisma,
      pointsOfLife,
      gold,
      injuries,
      protection,
      background,
      pros,
      cons,
      origin,
      baseSkills,
    } = req.body;

    const defaultBaseSkills = [
      { name: "Artisanat", link1: "dexterity", link2: "intelligence", bonusMalus: 0 },
      { name: "Combat rapproché", link1: "strength", link2: "dexterity", bonusMalus: 0 },
      { name: "Combat à distance", link1: "dexterity", link2: "intelligence", bonusMalus: 0 },
      { name: "Discrétion", link1: "dexterity", link2: "charisma", bonusMalus: 0 },
      { name: "Réflexe", link1: "dexterity", link2: "intelligence", bonusMalus: 0 }
    ];

    const parsedSkills = req.body.skills ? JSON.parse(req.body.skills) : [];
    const parsedInventory = req.body.inventory ? JSON.parse(req.body.inventory) : [];
    const parsedBaseSkills = req.body.baseSkills ? JSON.parse(req.body.baseSkills) : defaultBaseSkills;

    let uploadedImageUrl = "";

    // ✅ Upload image vers Cloudinary si présente
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "characterPictures",
        width: 260,
        height: 260,
        crop: "fill",     // Remplit exactement 260x260 en rognant si nécessaire
        format: "webp",   // Convertit en .webp
      });
      
      uploadedImageUrl = result.secure_url;

      // 🧹 Supprimer le fichier local temporaire
      fs.unlinkSync(req.file.path);
    }

    const newCharacter = new Character({
      game,
      name,
      age,
      className,
      image: uploadedImageUrl, // ✅ URL Cloudinary ici
      strength,
      dexterity,
      endurance,
      intelligence,
      charisma,
      pointsOfLife,
      gold,
      injuries,
      protection,
      background,
      pros,
      cons,
      origin,
      baseSkills: parsedBaseSkills,
      skills: parsedSkills,
      inventory: parsedInventory,
      userId: req.user.id,
    });

    await newCharacter.save();
    res.status(201).json({ message: "Personnage créé avec succès", character: newCharacter });
  } catch (error) {
    console.error("❌ Erreur lors de la création du personnage:", error);
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
};

// 📌 Récupérer un personnage par son ID
 const getCharacterById = async (req, res) => {
  try {
    const character = await Character.findById(req.params.id);
    if (!character) {
      return res.status(404).json({ message: "Personnage non trouvé" });
    }
    res.status(200).json(character);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📌 Récupérer tous les personnages
const getAllCharacters = async (req, res) => {
  try {
    const characters = await Character.find();
    res.status(200).json(characters);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📌 Mettre à jour un personnage
function tryParse(value) {
  try {
    return typeof value === "string" ? JSON.parse(value) : value;
  } catch (err) {
    console.warn("⚠️ JSON parse failed:", value);
    return value;
  }
}

// Met à jour un personnage
const updateCharacter = async (req, res) => {
  try {
    console.log("🔍 Données reçues :", req.body);

    const { baseSkills } = req.body;

    const updatedBaseSkills = Array.isArray(baseSkills)
      ? baseSkills.map((skill) => ({
          ...skill,
          bonusMalus: skill.bonusMalus || 0,
        }))
      : tryParse(baseSkills);

    let uploadedImageUrl = req.body.image;

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "characterPictures",
        width: 260,
        height: 260,
        crop: "fill",
        format: "webp",
      });
      uploadedImageUrl = result.secure_url;
      fs.unlinkSync(req.file.path);
    }

    const updatedData = {
      ...req.body,
      baseSkills: updatedBaseSkills,
      image: uploadedImageUrl,
      skills: tryParse(req.body.skills),
      inventory: tryParse(req.body.inventory),
      weapons: tryParse(req.body.weapons),
      tableIds: tryParse(req.body.tableIds),
    };

    const updatedCharacter = await Character.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true, runValidators: true }
    );

    if (!updatedCharacter) {
      return res.status(404).json({ message: "Personnage non trouvé" });
    }

    res.status(200).json(updatedCharacter);
  } catch (error) {
    console.error("❌ Erreur mise à jour personnage:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// 📌 Supprimer un personnage
const deleteCharacter = async (req, res) => {
  try {
    const deletedCharacter = await Character.findByIdAndDelete(req.params.id);
    if (!deletedCharacter) {
      return res.status(404).json({ message: "Personnage non trouvé" });
    }
    res.status(200).json({ message: "Personnage supprimé avec succès" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📌 Récupérer les personnages d'un utilisateur spécifique (authentifié)
const getUserCharacters = async (req, res) => {
  try {
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    const userId = req.user.id;
    const characters = await Character.find({ userId });

    res.status(200).json(characters);
  } catch (error) {
    console.error("🔴 Erreur dans getUserCharacters :", error);
    res.status(500).json({ message: error.message });
  }
};

const getCharactersByUser = async (req, res) => {
  try {
    const characters = await Character.find({ userId: req.user.id })
      .populate('weapons')  // Résoudre les références des armes
      .populate('skills')   // Résoudre les références des compétences
      .populate('inventory') // Résoudre les références des objets
      .exec();

    if (!characters) {
      return res.status(404).json({ message: "Aucun personnage trouvé" });
    }

    res.status(200).json({ characters });
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des personnages:", error);
    res.status(500).json({ message: "Erreur interne du serveur", error });
  }
};

const updateHealth = async (req, res) => {
  try {
    console.log("📥 Requête reçue pour updateHealth :", req.body);

    const { pointsOfLife, tableId } = req.body; // Ajout de `tableId`
    
    if (pointsOfLife === undefined) {
      return res.status(400).json({ message: "Le champ pointsOfLife est requis" });
    }

    if (!tableId) {
      return res.status(400).json({ message: "Le champ tableId est requis" });
    }

    // 🔍 Récupérer le personnage
    const character = await Character.findById(req.params.id);
    if (!character) {
      return res.status(404).json({ message: "Personnage non trouvé" });
    }

    // ✅ Vérifier si le personnage appartient bien à cette table
    if (!character.tableIds.includes(tableId)) {
      console.warn(`⚠️ Le personnage ${character._id} ne fait pas partie de cette table. Ajout en cours...`);

      // 🔍 Trouver la table contenant ce personnage
      const table = await TableTop.findOne({ "players.selectedCharacter": character._id });

      if (table) {
        console.log(`✅ Table trouvée : ${table._id}`);

        // 🔹 Ajouter cette table à la liste des tables du personnage si elle n'existe pas
        if (!character.tableIds.includes(table._id)) {
          character.tableIds.push(table._id);
          await character.save();
        }
      } else {
        console.error(`❌ Impossible de trouver une table associée au personnage ${character._id}`);
        return res.status(400).json({ message: "Ce personnage n'est pas associé à une table" });
      }
    }

    console.log(`🔍 Table ID final utilisé : ${tableId}`);

    // ✅ Mettre à jour les PV
    character.pointsOfLife = pointsOfLife;
    await character.save();

    // ✅ Vérifier si l'instance de socket.io est bien récupérée
    const io = req.app.get("io");
    if (!io) {
      console.error("❌ ERREUR : io non trouvé dans req.app !");
      return res.status(500).json({ message: "Erreur serveur : io non défini" });
    }

    // ✅ Émettre l'événement à la bonne salle "table-{tableId}"
    console.log(`📡 Emission de "updateHealth" à table-${tableId}`);
    io.to(`table-${tableId}`).emit("updateHealth", {
      characterId: character._id,
      pointsOfLife: character.pointsOfLife,
    });

    res.json(character);
  } catch (error) {
    console.error("❌ Erreur mise à jour des PV :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

module.exports = {
  createCharacter,
  getCharacterById,
  getAllCharacters,
  updateCharacter,
  deleteCharacter,
  getUserCharacters,
  getCharactersByUser,
  updateHealth,
}