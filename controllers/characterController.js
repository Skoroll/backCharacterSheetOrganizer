const Character = require("../models/characterModel");
const getCharacterModel = require("../utils/getCharacterModel");
const TableTop = require("../models/tabletopModel");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const shuffleDeck = require("../utils/shuffleDeckAria");
const allModels = [
  require("../models/characterModel"),
  require("../models/characterVtmModel"),
];

// 📌 Créer un personnage avec image
const createCharacterAria = async (req, res) => {
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
    } = req.body;

    const defaultBaseSkills = [
      {
        name: "Artisanat",
        link1: "dexterity",
        link2: "intelligence",
        bonusMalus: 0,
      },
      {
        name: "Combat rapproché",
        link1: "strength",
        link2: "dexterity",
        bonusMalus: 0,
      },
      {
        name: "Combat à distance",
        link1: "dexterity",
        link2: "intelligence",
        bonusMalus: 0,
      },
      {
        name: "Discrétion",
        link1: "dexterity",
        link2: "charisma",
        bonusMalus: 0,
      },
      {
        name: "Réflexe",
        link1: "dexterity",
        link2: "intelligence",
        bonusMalus: 0,
      },
    ];

    const parsedSkills = req.body.skills ? JSON.parse(req.body.skills) : [];
    const parsedInventory = req.body.inventory
      ? JSON.parse(req.body.inventory)
      : [];
    const parsedBaseSkills = req.body.baseSkills
      ? JSON.parse(req.body.baseSkills)
      : defaultBaseSkills;
    const parsedWeapons = req.body.weapons ? JSON.parse(req.body.weapons) : [];
    let parsedMagic = req.body.magic
      ? JSON.parse(req.body.magic)
      : { ariaMagic: false, deathMagic: false };

    //Initialisation complète de la magie d'Aria si activée
    if (parsedMagic.ariaMagic) {
      parsedMagic.ariaMagicCards = parsedMagic.ariaMagicCards?.length
        ? parsedMagic.ariaMagicCards
        : shuffleDeck();

      parsedMagic.ariaMagicUsedCards = parsedMagic.ariaMagicUsedCards?.length
        ? parsedMagic.ariaMagicUsedCards
        : [];
    } else {
      parsedMagic.ariaMagicCards = [];
      parsedMagic.ariaMagicUsedCards = [];
    }

    console.log("✅ Magic envoyé :", parsedMagic);
    console.log("🃏 Cartes d'Aria :", parsedMagic.ariaMagicCards?.length);

    //Initialise la magie de mort
    if (parsedMagic.deathMagic) {
      parsedMagic.deathMagicMax = parsedMagic.deathMagicMax || 10;
      parsedMagic.deathMagicCount = Math.min(
        parsedMagic.deathMagicCount || 0,
        parsedMagic.deathMagicMax
      );
    } else {
      parsedMagic.deathMagicCount = 0;
      parsedMagic.deathMagicMax = 0;
    }

    let uploadedImageUrl = "";

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

    console.log("✅ Magic envoyé :", parsedMagic);

    const newCharacter = new Character({
      game,
      name,
      age,
      className,
      image: uploadedImageUrl,
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
      weapons: parsedWeapons,
      userId: req.user.id,
      magic: parsedMagic,
    });

    await newCharacter.save();
    res
      .status(201)
      .json({
        message: "Personnage créé avec succès",
        character: newCharacter,
      });
  } catch (error) {
    console.error("Erreur lors de la création du personnage Aria :", error);
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
};

// Récupérer un personnage par son ID
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

// Récupérer tous les personnages
const getAllCharacters = async (req, res) => {
  try {
    const results = await Promise.all(allModels.map((Model) => Model.find({})));
    const allCharacters = results.flat();
    res.json(allCharacters);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// Mettre à jour un personnage
function tryParse(value) {
  try {
    return typeof value === "string" ? JSON.parse(value) : value;
  } catch (err) {
    console.warn("JSON parse failed:", value);
    return value;
  }
}

// Met à jour un personnage
const updateCharacter = async (req, res) => {
  try {
    console.log("Données reçues :", req.body);

    const character = await Character.findById(req.params.id);
    if (!character) {
      return res.status(404).json({ message: "Personnage non trouvé" });
    }

    // Traitement des données
    const updatedBaseSkills = Array.isArray(req.body.baseSkills)
      ? req.body.baseSkills.map((skill) => ({
          ...skill,
          bonusMalus: skill.bonusMalus || 0,
        }))
      : tryParse(req.body.baseSkills);

    let uploadedImageUrl = character.image;

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
    if (
      character.magic &&
      character.magic.ariaMagic &&
      (!character.magic.ariaMagicCards ||
        character.magic.ariaMagicCards.length === 0)
    ) {
      character.magic.ariaMagicCards = shuffleDeck();
      character.magic.ariaMagicUsedCards = [];
    }

    const updatedFields = {
      ...req.body,
      baseSkills: updatedBaseSkills,
      image: uploadedImageUrl,
      skills: tryParse(req.body.skills),
      inventory: tryParse(req.body.inventory),
      weapons: tryParse(req.body.weapons),
      tableIds: tryParse(req.body.tableIds),
      magic: tryParse(req.body.magic),
    };

    // 🛠️ Met à jour proprement les champs du personnage
    for (const key in updatedFields) {
      character.set(key, updatedFields[key]);
    }

    // Initialiser le deck d'Aria si besoin
    if (
      updatedFields.magic?.ariaMagic &&
      (!Array.isArray(updatedFields.magic.ariaMagicCards) ||
        updatedFields.magic.ariaMagicCards.length === 0)
    ) {
      updatedFields.magic.ariaMagicCards = shuffleDeck();
      updatedFields.magic.ariaMagicUsedCards = [];
    }

    // Correction préventive du deathMagicCount
    if (
      character.magic &&
      character.magic.deathMagicCount > character.magic.deathMagicMax
    ) {
      character.magic.deathMagicCount = character.magic.deathMagicMax;
    }

    await character.save();
    res.status(200).json(character);
  } catch (error) {
    console.error("Erreur mise à jour personnage:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// Supprimer un personnage
const deleteCharacter = async (req, res) => {
  try {
    const character = await Character.findById(req.params.id);
    if (!character) {
      return res.status(404).json({ message: "Personnage non trouvé" });
    }

    // Supprimer l'image de Cloudinary si elle existe
    if (character.image) {
      try {
        const segments = character.image.split("/");
        const filename = segments[segments.length - 1];
        const publicId = `characterPictures/${filename.substring(
          0,
          filename.lastIndexOf(".")
        )}`;

        const result = await cloudinary.uploader.destroy(publicId);
      } catch (err) {
        console.warn("Impossible de supprimer l'image Cloudinary :", err);
      }
    }

    // Supprimer le personnage de la base de données
    await character.deleteOne();

    res.status(200).json({ message: "Personnage supprimé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression du personnage :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// Récupérer les personnages d'un utilisateur spécifique (authentifié)
const getUserCharacters = async (req, res) => {
  const gameSystem = req.query.game || "aria"; // ?game=vtm
  const Character = getCharacterModel(gameSystem);

  try {
    const characters = await Character.find({ userId: req.user._id });
    res.json(characters);
  } catch (error) {
    console.error("Erreur getUserCharacters :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

const getCharactersByUser = async (req, res) => {
  try {
    const characters = await Character.find({ userId: req.user.id })
      .populate("weapons") // Résoudre les références des armes
      .populate("skills") // Résoudre les références des compétences
      .populate("inventory") // Résoudre les références des objets
      .exec();

    if (!characters) {
      return res.status(404).json({ message: "Aucun personnage trouvé" });
    }

    res.status(200).json({ characters });
  } catch (error) {
    console.error("Erreur lors de la récupération des personnages:", error);
    res.status(500).json({ message: "Erreur interne du serveur", error });
  }
};

const updateHealth = async (req, res) => {
  try {
    console.log("Requête reçue pour updateHealth :", req.body);

    const { pointsOfLife, tableId } = req.body; // Ajout de `tableId`

    if (pointsOfLife === undefined) {
      return res
        .status(400)
        .json({ message: "Le champ pointsOfLife est requis" });
    }

    if (!tableId) {
      return res.status(400).json({ message: "Le champ tableId est requis" });
    }

    // Récupérer le personnage
    const character = await Character.findById(req.params.id);
    if (!character) {
      return res.status(404).json({ message: "Personnage non trouvé" });
    }

    // Vérifier si le personnage appartient bien à cette table
    if (!character.tableIds.includes(tableId)) {
      console.warn(
        `Le personnage ${character._id} ne fait pas partie de cette table. Ajout en cours...`
      );

      // Trouver la table contenant ce personnage
      const table = await TableTop.findOne({
        "players.selectedCharacter": character._id,
      });

      if (table) {
        console.log(`Table trouvée : ${table._id}`);

        // Ajouter cette table à la liste des tables du personnage si elle n'existe pas
        if (!character.tableIds.includes(table._id)) {
          character.tableIds.push(table._id);
          await character.save();
        }
      } else {
        console.error(
          `Impossible de trouver une table associée au personnage ${character._id}`
        );
        return res
          .status(400)
          .json({ message: "Ce personnage n'est pas associé à une table" });
      }
    }

    console.log(`Table ID final utilisé : ${tableId}`);

    // Mettre à jour les PV
    character.pointsOfLife = pointsOfLife;
    await character.save();

    // Vérifier si l'instance de socket.io est bien récupérée
    const io = req.app.get("io");
    if (!io) {
      console.error("ERREUR : io non trouvé dans req.app !");
      return res
        .status(500)
        .json({ message: "Erreur serveur : io non défini" });
    }

    // Émettre l'événement à la bonne salle "table-{tableId}"
    console.log(`📡 Emission de "updateHealth" à table-${tableId}`);
    io.to(`table-${tableId}`).emit("updateHealth", {
      characterId: character._id,
      pointsOfLife: character.pointsOfLife,
    });

    res.json(character);
  } catch (error) {
    console.error("Erreur mise à jour des PV :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

const drawAriaCard = async (req, res) => {
  const character = await Character.findById(req.params.id);

  if (
    !character.magic.ariaMagicCards ||
    character.magic.ariaMagicCards.length === 0
  ) {
    return res
      .status(400)
      .json({ message: "Le deck est vide, impossible de piocher." });
  }
  

  if (!character || !character.magic.ariaMagic) {
    return res
      .status(400)
      .json({ message: "Ce personnage ne peut pas utiliser la magie d'Aria." });
  }

  // Initialiser le deck s’il est vide
  if (
    !character.magic.ariaMagicCards ||
    character.magic.ariaMagicCards.length === 0
  ) {
    character.magic.ariaMagicCards = shuffleDeck();
    character.magic.ariaMagicUsedCards = [];
  }

  const card = character.magic.ariaMagicCards.pop();

  if (!card) {
    return res.status(400).json({
      message: "Le deck est vide, impossible de piocher une nouvelle carte.",
    });
  }
  
  character.magic.ariaMagicUsedCards.push(card);
  

  await character.save();
  res.status(200).json({ card });
};

const reshuffleAriaDeck = async (req, res) => {
  const character = await Character.findById(req.params.id);
  if (!character || !character.magic.ariaMagic) {
    return res
      .status(400)
      .json({ message: "Ce personnage ne peut pas utiliser la magie d'Aria." });
  }

  character.magic.ariaMagicCards = shuffleDeck();
  character.magic.ariaMagicUsedCards = [];

  await character.save();
  res.status(200).json({ message: "Deck mélangé" });
};

const updateDeathMagic = async (req, res) => {
  const { id } = req.params;
  const { deathMagicCount, tableId } = req.body;

  try {
    const character = await Character.findById(id);
    if (!character) return res.status(404).json({ message: "Personnage non trouvé" });

    if (!character.magic) {
      character.magic = {
        ariaMagic: false,
        deathMagic: true,
        deathMagicCount: 0,
        deathMagicMax: 0,
        ariaMagicCards: [],
        ariaMagicUsedCards: [],
      };
    }

    character.magic.deathMagicCount = deathMagicCount;
    await character.save();

    // Envoie une mise à jour à la table si besoin
    if (tableId) {
      req.io?.to(`table-${tableId}`).emit("characterUpdated", {
        characterId,
        update: { magic: character.magic },
      });
    }

    res.status(200).json({ message: "Points de magie de mort mis à jour", magic: character.magic });
  } catch (err) {
    console.error("❌ Erreur dans updateDeathMagic :", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

const updateGold = async (req, res) => {
  const { id } = req.params;
  const { gold } = req.body;

  try {
    if (gold === undefined || typeof gold !== "number" || gold < 0) {
      return res.status(400).json({ message: "Or invalide ou manquant" });
    }

    const character = await Character.findById(id);
    if (!character) {
      return res.status(404).json({ message: "Personnage non trouvé" });
    }

    character.gold = gold;
    await character.save();

    res.status(200).json({ message: "Or mis à jour", gold: character.gold });
  } catch (err) {
    console.error("❌ Erreur updateGold :", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};


module.exports = {
  createCharacterAria,
  getCharacterById,
  getAllCharacters,
  updateCharacter,
  deleteCharacter,
  getUserCharacters,
  getCharactersByUser,
  updateHealth,
  drawAriaCard,
  reshuffleAriaDeck,
  updateDeathMagic,
  updateGold,
};
