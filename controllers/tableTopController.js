const TableTop = require("../models/tabletopModel");
const User = require("../models/userModel");
const Character = require("../models/characterModel");
const Item = require("../models/item");
const Npc = require("../models/npcModel");
const GmFile = require("../models/GmFilesModel");
const Message = require("../models/Message");
const bcrypt = require("bcryptjs");
const cloudinary = require("cloudinary").v2;
const mongoose = require("mongoose");

// Créer une nouvelle table
exports.tableCreate = async (req, res) => {
  const { name, password, game, gameMaster, gameMasterName } = req.body;

  if (!name || !password || !gameMaster || !gameMasterName) {
    return res
      .status(400)
      .json({ message: "Tous les champs sont obligatoires." });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    // Création de la table avec le MJ bien défini
    const newTable = await TableTop.create({
      name,
      password: hashedPassword,
      game,
      gameMaster,
      gameMasterName,
      players: [
        { userId: gameMaster, playerName: gameMasterName, isGameMaster: true },
      ],
      bannedPlayers: [],
    });

    // 🔹 Ajouter la table aux `tablesJoined` du MJ
    await User.findByIdAndUpdate(gameMaster, {
      $addToSet: { tablesJoined: newTable._id },
    });

    res.status(201).json({
      message: "Table créée avec succès.",
      table: {
        id: newTable._id,
        name: newTable.name,
        gameMaster: newTable.gameMaster,
        gameMasterName: newTable.gameMasterName,
      },
    });
  } catch (err) {
    console.error("Erreur lors de la création de la table :", err);
    res.status(500).json({ message: "Erreur interne du serveur." });
  }
};

// Récupérer toutes les tables avec les joueurs
exports.getTables = async (req, res) => {
  try {
    const tables = await TableTop.find(
      {},
      "name game players gameMasterName bannerImage, selectedFont, tableBG"
    )
      .populate("players.userId", "playerName selectedCharacter")
      .exec();

    res.json({ tables });
  } catch (err) {
    console.error("Erreur récupération tables :", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// Récupérer une table par ID
exports.getTableById = async (req, res) => {
  const tableId = req.params.id;

  try {
    const table = await TableTop.findById(tableId)
    .populate("players.userId", "name")
    .exec();  
    if (!table) return res.status(404).json({ message: "Table non trouvée" });

    res.json(table);
  } catch (error) {
    console.error("Erreur lors de la récupération de la table", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// Vérification du mot de passe
exports.verifyPassword = async (req, res) => {
  const { password } = req.body;
  const tableId = req.params.id;

  try {
    const table = await TableTop.findById(tableId);
    if (!table) return res.status(404).json({ message: "Table non trouvée" });

    const match = await bcrypt.compare(password, table.password);
    if (!match)
      return res.status(400).json({ message: "Mot de passe incorrect" });

    res.status(200).json({ message: "Mot de passe vérifié" });
  } catch (error) {
    console.error("Erreur lors de la vérification du mot de passe", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// Ajouter un joueur à une table
exports.addPlayer = async (req, res) => {
  const { tableId } = req.params;
  const { userId, selectedCharacter } = req.body;

  try {
    const table = await TableTop.findById(tableId);
    if (!table) return res.status(404).json({ message: "Table introuvable" });

    if (table.bannedPlayers.includes(userId)) {
      return res.status(403).json({ message: "Ce joueur est banni de la table" });
    }

    const existingPlayerIndex = table.players.findIndex(
      (player) => player.userId.toString() === userId
    );

    if (existingPlayerIndex !== -1) {
      const existingPlayer = table.players[existingPlayerIndex];
      const characterExists = await Character.findById(existingPlayer.selectedCharacter);

      if (!characterExists) {
        table.players.splice(existingPlayerIndex, 1);
      } else {
        return res.status(400).json({ message: "Joueur déjà présent." });
      }
    }

    const characterStillExists = await Character.findById(selectedCharacter);
    if (!characterStillExists) {
      return res.status(404).json({ message: "Personnage introuvable." });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });

    table.players.push({
      userId,
      playerName: user.userPseudo || "Joueur",
      selectedCharacter,
      isGameMaster: false,
    });

    await table.save();
    await User.findByIdAndUpdate(userId, { $addToSet: { tablesJoined: tableId } });

    const io = req.app.get("io");
    io.to(`table-${tableId}`).emit("refreshPlayers");

    // ✅ LOG
    const logMsg = `[JOIN] ${user.userPseudo} (${userId}) a rejoint la table "${table.name}" (${tableId})`;
    io.emit("log", logMsg);
    console.log(logMsg);

    res.status(200).json({ message: "Joueur ajouté avec succès." });
  } catch (error) {
    console.error("❌ Erreur lors de l'ajout du joueur:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// Supprimer une table et toutes ses ressources associées
exports.deleteTable = async (req, res) => {
  const tableId = req.params.id;

  try {
    const table = await TableTop.findById(tableId);
    if (!table) return res.status(404).json({ message: "Table non trouvée" });

    // 🔥 Supprimer l'image de bannière Cloudinary si présente
    if (table.bannerImage?.includes("res.cloudinary.com")) {
      const segments = table.bannerImage.split("/");
      const publicId = `tableBanner/${segments[segments.length - 1].split(".")[0]}`;
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch (err) {
        console.warn("⚠️ Échec suppression bannière Cloudinary :", err.message);
      }
    }

    // 🗑️ Supprimer les objets liés à la table
    await Item.deleteMany({ tableId });

    // 🗑️ Supprimer les messages liés à la table
    await Message.deleteMany({ tableId });

    // 🗑️ Supprimer les fichiers du MJ liés à la table + leurs images sur Cloudinary
    const gmFiles = await GmFile.find({ tableId });
    for (const file of gmFiles) {
      if (file.type === "image" && file.path?.includes("res.cloudinary.com")) {
        const segments = file.path.split("/");
        const publicId = `gmAssets/${segments[segments.length - 1].split(".")[0]}`;
        try {
          await cloudinary.uploader.destroy(publicId);
        } catch (err) {
          console.warn("⚠️ Échec suppression image MJ :", err.message);
        }
      }
    }
    await GmFile.deleteMany({ tableId });

    // 🗑️ Supprimer les PNJs + leurs images sur Cloudinary
    const npcs = await Npc.find({ tableId });
    for (const npc of npcs) {
      if (npc.image?.includes("res.cloudinary.com")) {
        const segments = npc.image.split("/");
        const publicId = `npcs/${segments[segments.length - 1].split(".")[0]}`;
        try {
          await cloudinary.uploader.destroy(publicId);
        } catch (err) {
          console.warn("⚠️ Échec suppression image PNJ :", err.message);
        }
      }
    }
    await Npc.deleteMany({ tableId });

    // ❌ Supprimer la table elle-même
    await table.deleteOne();

    res.status(200).json({ message: "Table et ressources supprimées avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression de la table et des ressources", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};


// Mettre à jour les notes du MJ
exports.updateNotes = async (req, res) => {
  const { id } = req.params;
  const { characters, quest, other, items } = req.body;

  try {
    const table = await TableTop.findById(id);
    if (!table) {
      return res.status(404).json({ message: "Table introuvable" });
    }

    table.gameMasterNotes = { characters, quest, other, items };
    await table.save();

    res.json({ message: "Notes mises à jour avec succès", table });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

exports.getGameMasterNotes = async (req, res) => {
  const { id } = req.params;
  try {
    const table = await TableTop.findById(id);
    if (!table) {
      return res.status(404).json({ message: "Table introuvable" });
    }

    res.json(table.gameMasterNotes); // 📌 Renvoie les notes du MJ
  } catch (error) {
    console.error("❌ Erreur serveur :", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// Mettre à jour les notes d'un joueur
exports.updatePlayerNotes = async (req, res) => {
  const { id } = req.params; // ID de la table
  const { playerId, characters, quest, other, items } = req.body;

  try {
    const table = await TableTop.findById(id);
    if (!table) return res.status(404).json({ message: "Table introuvable" });

    // Trouver les notes du joueur dans `playerNotes`
    const playerNoteIndex = table.playerNotes.findIndex(
      (note) => note.playerId.toString() === playerId
    );

    if (playerNoteIndex !== -1) {
      // Si les notes existent, on les met à jour
      table.playerNotes[playerNoteIndex] = {
        playerId,
        characters,
        quest,
        other,
        items,
      };
    } else {
      // Sinon, on ajoute un nouvel objet de notes pour le joueur
      table.playerNotes.push({ playerId, characters, quest, other, items });
    }

    await table.save();

    res.json({ message: "Notes du joueur mises à jour avec succès", table });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// Récupérer les joueurs d'une table
exports.getPlayersFromTable = async (req, res) => {
  const tableId = req.params.id;

  try {
    const table = await TableTop.findById(tableId)
      .populate("players.selectedCharacter") // 🔥 Assure que `selectedCharacter` contient les détails
      .exec();

    if (!table) return res.status(404).json({ message: "Table non trouvée" });

    res.status(200).json(table.players);
  } catch (error) {
    console.error(
      "❌ Erreur serveur lors de la récupération des joueurs :",
      error
    );
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// Récupérer les notes d'un joueur spécifique
exports.getPlayerNotes = async (req, res) => {
  const { id } = req.params; // ID de la table
  const { playerId } = req.query; // ID du joueur

  try {
    // Vérifie si l'ID de la table est valide
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID de table invalide" });
    }

    // Vérifie si l'ID du joueur est valide
    if (!mongoose.Types.ObjectId.isValid(playerId)) {
      return res.status(400).json({ message: "ID du joueur invalide" });
    }

    const table = await TableTop.findById(id);
    if (!table) {
      return res.status(404).json({ message: "Table introuvable" });
    }

    if (!table.playerNotes) {
      return res.status(500).json({ message: "Erreur interne : `playerNotes` non défini." });
    }

    // Chercher les notes du joueur
    const playerNotes = table.playerNotes.find(
      (note) => note.playerId.toString() === playerId
    );

    if (!playerNotes) {
      // ✅ Si aucune note → retourner une note vide (200 OK)
      return res.status(200).json({
        characters: "",
        quest: "",
        other: "",
        items: ""
      });
    }

    // ✅ Si trouvé → envoyer les notes existantes
    res.status(200).json(playerNotes);
  } catch (error) {
    console.error("❌ Erreur serveur :", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// Supprimer un joueur d'une table
exports.removePlayerFromTable = async (req, res) => {
  const { tableId, userId } = req.params;

  try {
    // Récupérer la table
    const table = await TableTop.findById(tableId);
    if (!table) return res.status(404).json({ message: "Table non trouvée" });

    // Récupérer l'utilisateur
    const user = await User.findById(userId);
    if (!user)
      return res.status(404).json({ message: "Utilisateur non trouvé" });

    // Vérification et suppression du joueur dans la table
    const playerIndex = table.players.findIndex(
      (player) => player.userId.toString() === userId
    );

    if (playerIndex === -1) {
      return res
        .status(404)
        .json({ message: "Joueur non trouvé dans cette table" });
    }

    // Supprimer le joueur et l'ajouter à la liste des bannis
    const removedPlayer = table.players.splice(playerIndex, 1)[0];
    table.bannedPlayers.push(removedPlayer.userId.toString());

    // Supprimer la table de `tablesJoined` du joueur
    user.tablesJoined = user.tablesJoined.filter(
      (joinedTableId) => joinedTableId.toString() !== tableId
    );

    // Sauvegarder les changements
    await table.save();
    await user.save();
    const io = req.app.get("io");
    io.to(`table-${tableId}`).emit("refreshPlayers");

    // LOG
    const logMsg = `[BAN] ${user.userPseudo} (${userId}) a été banni de la table "${table.name}" (${tableId})`;
    io.emit("log", logMsg);
    console.log(logMsg);
    res
      .status(200)
      .json({
        message:
          "Joueur supprimé avec succès et mis à jour dans le compte utilisateur",
      });
  } catch (error) {
    console.error("❌ Erreur lors de la suppression du joueur :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// Supprimer le personnage d'un joueur (mais pas le joueur)
exports.removePlayerCharacter = async (req, res) => {
  const { tableId, userId } = req.params;

  try {
    const table = await TableTop.findById(tableId);
    if (!table) return res.status(404).json({ message: "Table non trouvée" });

    // Trouver le joueur dans la table
    const player = table.players.find((p) => p.userId.toString() === userId);
    if (!player) return res.status(404).json({ message: "Joueur non trouvé" });

    // Supprimer son personnage sans le bannir
    player.selectedCharacter = null;
    await table.save();
    const io = req.app.get("io");
    io.to(`table-${tableId}`).emit("refreshPlayers");
    res
      .status(200)
      .json({ message: "Personnage supprimé avec succès", player });
  } catch (error) {
    console.error("❌ Erreur lors de la suppression du personnage :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.selectCharacterForPlayer = async (req, res) => {
  try {
    const { tableId, playerId, characterId } = req.body;

    if (!tableId || !playerId || !characterId) {
      return res
        .status(400)
        .json({
          message:
            "Tous les champs (tableId, playerId, characterId) sont requis",
        });
    }

    const table = await TableTop.findById(tableId);
    if (!table) {
      return res.status(404).json({ message: "Table introuvable" });
    }

    const character = await Character.findById(characterId);
    if (!character) {
      return res.status(404).json({ message: "Personnage introuvable" });
    }

    const player = table.players.find((p) => p.userId.toString() === playerId);
    if (!player) {
      return res
        .status(403)
        .json({ message: "Le joueur ne fait pas partie de cette table" });
    }

    // ✅ S'assurer que tableIds est bien défini avant de l'utiliser
    if (!Array.isArray(character.tableIds)) {
      character.tableIds = [];
    }

    // ✅ Ajouter la table seulement si elle n'est pas déjà présente
    if (!character.tableIds.includes(tableId)) {
      character.tableIds.push(tableId);
      await character.save();
    }

    // ✅ Met à jour le joueur seulement si `selectedCharacter` change
    if (player.selectedCharacter !== characterId) {
      player.selectedCharacter = characterId;
      await table.save();
    }

    res.json({ message: "Personnage sélectionné avec succès", table });
  } catch (error) {
    console.error("❌ Erreur sélection personnage :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.updateTableStyle = async (req, res) => {
  const { id } = req.params;
  const { borderWidth, borderColor, bannerStyle, selectedFont, tableBG } =
    req.body;

  const io = req.app.get("io"); // Récupérer l'instance de Socket.IO

  try {
    const table = await TableTop.findById(id);
    if (!table) {
      console.error("❌ Table introuvable :", id);
      return res.status(404).json({ message: "Table introuvable" });
    }

    if (!req.files || req.files.length === 0) {
      table.borderWidth = borderWidth || table.borderWidth;
      table.borderColor = borderColor || table.borderColor;
      table.bannerStyle = bannerStyle || table.bannerStyle;
      table.selectedFont = selectedFont || table.selectedFont;
      table.tableBG = tableBG || table.tableBG;

      const updatedTable = await table.save();

      io.to(`table-${id}`).emit("refreshTableStyle"); // ✅ Emit ici
      return res.status(200).json(updatedTable);
    }

    const file = req.files[0];

    // 🔥 Supprimer l’ancienne image Cloudinary
    if (table.bannerImage?.includes("res.cloudinary.com")) {
      const segments = table.bannerImage.split("/");
      const publicId = `tableBanner/${
        segments[segments.length - 1].split(".")[0]
      }`;

      try {
        await cloudinary.uploader.destroy(publicId);
      } catch (err) {
        console.warn("⚠️ Échec suppression Cloudinary :", err.message);
        return res
          .status(500)
          .json({ message: "Erreur suppression image précédente" });
      }
    }

    // ✅ Upload Cloudinary
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "tableBanner",
        width: 1280,
        crop: "limit",
        format: "webp",
      },
      async (error, result) => {
        if (error) {
          console.error("❌ Erreur Cloudinary :", error);
          return res
            .status(500)
            .json({ message: "Erreur lors de l'upload Cloudinary" });
        }

        table.bannerImage = result.secure_url;
        table.borderWidth = borderWidth || table.borderWidth;
        table.borderColor = borderColor || table.borderColor;
        table.bannerStyle = bannerStyle || table.bannerStyle;
        table.selectedFont = selectedFont || table.selectedFont;
        table.tableBG = tableBG || table.tableBG;

        const updatedTable = await table.save();

        io.to(`table-${id}`).emit("refreshTableStyle");

        return res.status(200).json(updatedTable);
      }
    );

    uploadStream.end(file.buffer);
  } catch (error) {
    console.error("❌ Erreur updateTableStyle :", error);
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

// Obtenir les joueurs bannis d'une table
exports.getBannedPlayers = async (req, res) => {
  const { tableId } = req.params;

  try {
    const table = await TableTop.findById(tableId).populate("bannedPlayers", "name");
    if (!table) return res.status(404).json({ message: "Table non trouvée" });

    res.json(table.bannedPlayers);
  } catch (error) {
    console.error("❌ Erreur récupération des joueurs bannis :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// Débannir un joueur
exports.unbanPlayer = async (req, res) => {
  const { tableId, userId } = req.params;

  try {
    const table = await TableTop.findById(tableId);
    if (!table) return res.status(404).json({ message: "Table non trouvée" });

    table.bannedPlayers = table.bannedPlayers.filter(
      (bannedId) => bannedId.toString() !== userId
    );

    await table.save();
    res.json({ message: "Joueur débanni avec succès" });
  } catch (error) {
    console.error("❌ Erreur débannissement :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};


// Un joueur quitte volontairement une table (sans être banni)
exports.leaveTableAsPlayer = async (req, res) => {
  const { tableId, userId } = req.params;
  try {
    const table = await TableTop.findById(tableId);
    if (!table) return res.status(404).json({ message: "Table non trouvée" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

    const playerIndex = table.players.findIndex(
      (p) => p.userId.toString() === userId
    );

    if (playerIndex === -1) {
      return res.status(404).json({ message: "Joueur non présent dans la table" });
    }

    // Supprimer uniquement sans bannir
    table.players.splice(playerIndex, 1);

    // Supprimer la table de la liste du joueur
    user.tablesJoined = user.tablesJoined.filter(
      (tId) => tId.toString() !== tableId
    );

    await table.save();
    await user.save();

    // Événement socket
    const io = req.app.get("io");
    io.to(`table-${tableId}`).emit("refreshPlayers");

    res.status(200).json({ message: "Vous avez quitté la table." });
  } catch (error) {
    console.error("❌ Erreur dans leaveTableAsPlayer :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};