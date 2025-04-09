const TableTop = require('../models/tabletopModel');
const User = require("../models/userModel");
const bcrypt = require('bcryptjs');
const fs = require("fs");
const path = require("path"); // ✅ Ajout de l'import path
const cloudinary = require("cloudinary").v2;
const Character = require("../models/characterModel");


// 📌 Créer une nouvelle table
exports.tableCreate = async (req, res) => {
  const { name, password, game, gameMaster, gameMasterName } = req.body;

  if (!name || !password || !gameMaster || !gameMasterName) {
    return res.status(400).json({ message: "Tous les champs sont obligatoires." });
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
      players: [{ userId: gameMaster, playerName: gameMasterName, isGameMaster: true }],
      bannedPlayers: [],
    });

    // 🔹 Ajouter la table aux `tablesJoined` du MJ
    await User.findByIdAndUpdate(gameMaster, { $addToSet: { tablesJoined: newTable._id } });

    res.status(201).json({
      message: "Table créée avec succès.",
      table: { id: newTable._id, name: newTable.name, gameMaster: newTable.gameMaster, gameMasterName: newTable.gameMasterName },
    });
  } catch (err) {
    console.error("Erreur lors de la création de la table :", err);
    res.status(500).json({ message: "Erreur interne du serveur." });
  }
};

// 📌 Récupérer toutes les tables avec les joueurs
exports.getTables = async (req, res) => {
  try {
    const tables = await TableTop.find({}, "name game players gameMasterName bannerImage, selectedFont, tableBG")
      .populate('players.userId', 'playerName selectedCharacter')
      .exec();

    res.json({ tables });
  } catch (err) {
    console.error("Erreur récupération tables :", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// 📌 Récupérer une table par ID
exports.getTableById = async (req, res) => {
  const tableId = req.params.id;

  try {
    const table = await TableTop.findById(tableId);
    if (!table) return res.status(404).json({ message: 'Table non trouvée' });

    res.json(table);
  } catch (error) {
    console.error("Erreur lors de la récupération de la table", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// 📌 Vérification du mot de passe
exports.verifyPassword = async (req, res) => {
  const { password } = req.body;
  const tableId = req.params.id;

  try {
    const table = await TableTop.findById(tableId);
    if (!table) return res.status(404).json({ message: "Table non trouvée" });

    const match = await bcrypt.compare(password, table.password);
    if (!match) return res.status(400).json({ message: "Mot de passe incorrect" });

    res.status(200).json({ message: "Mot de passe vérifié" });
  } catch (error) {
    console.error("Erreur lors de la vérification du mot de passe", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// 📌 Ajouter un joueur à une table
exports.addPlayer = async (req, res) => {
  const { tableId } = req.params;
  const { userId, selectedCharacter } = req.body;

  try {
    const table = await TableTop.findById(tableId);
    if (!table) return res.status(404).json({ message: "Table introuvable" });

    // 🔒 Vérifier si le joueur est banni
    if (table.bannedPlayers.includes(userId)) {
      return res.status(403).json({ message: "Ce joueur est banni de la table" });
    }

    // 🔍 Vérifier si le joueur est déjà dans la table
    const existingPlayerIndex = table.players.findIndex(
      (player) => player.userId.toString() === userId
    );

    // ✅ Si le joueur est présent, vérifier l'état de son personnage
    if (existingPlayerIndex !== -1) {
      const existingPlayer = table.players[existingPlayerIndex];
      const characterExists = await Character.findById(existingPlayer.selectedCharacter);

      if (!characterExists) {
        // 🧹 Supprimer l'ancien enregistrement si le personnage n'existe plus
        table.players.splice(existingPlayerIndex, 1);
      } else {
        return res.status(400).json({ message: "Le joueur est déjà présent à la table avec un personnage valide." });
      }
    }

    // 🔐 Vérifie que le personnage existe toujours avant ajout
    const characterStillExists = await Character.findById(selectedCharacter);
    if (!characterStillExists) {
      return res.status(404).json({ message: "Le personnage sélectionné est introuvable." });
    }

    // 🧠 Récupérer l'utilisateur pour le nom
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });
    
    table.players.push({
      userId,
      playerName: user.userPseudo || "Joueur",
      selectedCharacter,
      isGameMaster: false,
    });
    

    await table.save();

    // ➕ Ajouter la table dans `tablesJoined` s'il ne l'a pas déjà
    await User.findByIdAndUpdate(userId, { $addToSet: { tablesJoined: tableId } });

    res.status(200).json({ message: "Joueur ajouté avec succès." });
  } catch (error) {
    console.error("❌ Erreur lors de l'ajout du joueur:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};


// 📌 Supprimer une table
exports.deleteTable = async (req, res) => {
  const tableId = req.params.id;

  try {
    const table = await TableTop.findById(tableId);
    if (!table) return res.status(404).json({ message: "Table non trouvée" });

    await table.deleteOne();
    res.status(200).json({ message: "Table supprimée avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression de la table", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// 📌 Mettre à jour les notes du MJ
exports.updateNotes = async (req, res) => {
  const { id } = req.params;
  console.log("🛠 updateNotes appelée avec ID :", id);

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
  console.log("🔹 Requête reçue pour récupérer les notes du MJ :", id);

  try {
    const table = await TableTop.findById(id);
    if (!table) {
      console.log("❌ Table introuvable :", id);
      return res.status(404).json({ message: "Table introuvable" });
    }

    res.json(table.gameMasterNotes); // 📌 Renvoie les notes du MJ
  } catch (error) {
    console.error("❌ Erreur serveur :", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// 📌 Mettre à jour les notes d'un joueur
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

// 📌 Récupérer les joueurs d'une table
exports.getPlayersFromTable = async (req, res) => {
  const tableId = req.params.id;

  try {
    const table = await TableTop.findById(tableId)
      .populate("players.selectedCharacter") // 🔥 Assure que `selectedCharacter` contient les détails
      .exec();

    if (!table) return res.status(404).json({ message: "Table non trouvée" });


    res.status(200).json(table.players);
  } catch (error) {
    console.error("❌ Erreur serveur lors de la récupération des joueurs :", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// 📌 Récupérer les notes d'un joueur spécifique
exports.getPlayerNotes = async (req, res) => {
  const { id } = req.params; // ID de la table
  const { playerId } = req.query; // ID du joueur

  console.log("🔹 Requête reçue pour récupérer les notes du joueur :", playerId, "dans la table :", id);

  try {
    // Vérifie si l'ID de la table est valide
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log("❌ ID de table invalide :", id);
      return res.status(400).json({ message: "ID de table invalide" });
    }

    // Vérifie si l'ID du joueur est valide
    if (!mongoose.Types.ObjectId.isValid(playerId)) {
      console.log("❌ ID du joueur invalide :", playerId);
      return res.status(400).json({ message: "ID du joueur invalide" });
    }

    const table = await TableTop.findById(id);
    if (!table) {
      console.log("❌ Table introuvable pour ID :", id);
      return res.status(404).json({ message: "Table introuvable" });
    }

    console.log("✅ Table trouvée :", table.name);
    console.log("📝 `playerNotes` actuel dans la table :", table.playerNotes);

    if (!table.playerNotes) {
      console.log("❌ `playerNotes` n'existe pas !");
      return res.status(500).json({ message: "Erreur interne : `playerNotes` non défini." });
    }

    // Trouver les notes du joueur
    const playerNotes = table.playerNotes.find(
      (note) => note.playerId.toString() === playerId
    );

    if (!playerNotes) {
      console.log("❌ Aucune note trouvée pour ce joueur :", playerId);
      return res.status(404).json({ message: "Aucune note trouvée pour ce joueur" });
    }

    console.log("✅ Notes du joueur récupérées :", playerNotes);
    res.status(200).json(playerNotes);
  } catch (error) {
    console.error("❌ Erreur serveur :", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};


// 📌 Supprimer un joueur d'une table
exports.removePlayerFromTable = async (req, res) => {
  const { tableId, userId } = req.params;
  console.log(`🗑️ BACKEND: Tentative de suppression du joueur ${userId} de la table ${tableId}`);

  try {
    // 🔹 Récupérer la table
    const table = await TableTop.findById(tableId);
    if (!table) return res.status(404).json({ message: "Table non trouvée" });

    // 🔹 Récupérer l'utilisateur
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

    // 🔹 Vérification et suppression du joueur dans la table
    const playerIndex = table.players.findIndex(
      (player) => player.userId.toString() === userId
    );

    if (playerIndex === -1) {
      console.log(`❌ Joueur ${userId} introuvable dans la table !`);
      return res.status(404).json({ message: "Joueur non trouvé dans cette table" });
    }

    // ✅ Supprimer le joueur et l'ajouter à la liste des bannis
    const removedPlayer = table.players.splice(playerIndex, 1)[0];
    table.bannedPlayers.push(removedPlayer.userId.toString());

    // ✅ Supprimer la table de `tablesJoined` du joueur
    user.tablesJoined = user.tablesJoined.filter(
      (joinedTableId) => joinedTableId.toString() !== tableId
    );

    // ✅ Sauvegarder les changements
    await table.save();
    await user.save();

    console.log(`✅ Joueur ${removedPlayer.userId} supprimé et banni de la table ${tableId}`);
    res.status(200).json({ message: "Joueur supprimé avec succès et mis à jour dans le compte utilisateur" });

  } catch (error) {
    console.error("❌ Erreur lors de la suppression du joueur :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// 📌 Supprimer le personnage d'un joueur (mais pas le joueur)
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

    res.status(200).json({ message: "Personnage supprimé avec succès", player });
  } catch (error) {
    console.error("❌ Erreur lors de la suppression du personnage :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.selectCharacterForPlayer = async (req, res) => {
  try {
    const { tableId, playerId, characterId } = req.body;

    if (!tableId || !playerId || !characterId) {
      return res.status(400).json({ message: "Tous les champs (tableId, playerId, characterId) sont requis" });
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
      return res.status(403).json({ message: "Le joueur ne fait pas partie de cette table" });
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
  const { borderWidth, borderColor, bannerStyle, selectedFont, tableBG } = req.body;
  console.log("🧾 req.body :", req.body);
  console.log("📸 req.files :", req.files);

  const io = req.app.get("io"); // ✅ Récupérer l'instance de Socket.IO

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
      console.log("✅ Style (sans image) mis à jour :", updatedTable);

      io.to(`table-${id}`).emit("refreshTableStyle"); // ✅ Emit ici
      return res.status(200).json(updatedTable);
    }

    const file = req.files[0];

    // 🔥 Supprimer l’ancienne image Cloudinary
    if (table.bannerImage?.includes("res.cloudinary.com")) {
      const segments = table.bannerImage.split("/");
      const publicId = `tableBanner/${segments[segments.length - 1].split(".")[0]}`;

      try {
        await cloudinary.uploader.destroy(publicId);
        console.log("🗑️ Ancienne image supprimée de Cloudinary :", publicId);
      } catch (err) {
        console.warn("⚠️ Échec suppression Cloudinary :", err.message);
        return res.status(500).json({ message: "Erreur suppression image précédente" });
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
          return res.status(500).json({ message: "Erreur lors de l'upload Cloudinary" });
        }

        table.bannerImage = result.secure_url;
        table.borderWidth = borderWidth || table.borderWidth;
        table.borderColor = borderColor || table.borderColor;
        table.bannerStyle = bannerStyle || table.bannerStyle;
        table.selectedFont = selectedFont || table.selectedFont;
        table.tableBG = tableBG || table.tableBG;

        const updatedTable = await table.save();
        console.log("✅ Style de table mis à jour avec image :", updatedTable);

        io.to(`table-${id}`).emit("refreshTableStyle"); // ✅ Emit ici aussi

        return res.status(200).json(updatedTable);
      }
    );

    uploadStream.end(file.buffer);
  } catch (error) {
    console.error("❌ Erreur updateTableStyle :", error);
    res.status(500).json({ message: "Erreur serveur", error });
  }
};
