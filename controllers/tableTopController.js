const TableTop = require('../models/tabletopModel');
const User = require("../models/userModel");
const bcrypt = require('bcrypt');

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
    const tables = await TableTop.find({}, "name game players")
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
  const { userId, playerName, selectedCharacter } = req.body;

  try {
    const table = await TableTop.findById(tableId);
    if (!table) return res.status(404).json({ message: "Table introuvable" });

    // Vérifier si le joueur est banni
    if (table.bannedPlayers.includes(userId)) {
      return res.status(403).json({ message: "Ce joueur est banni de la table" });
    }

    // Vérifier si le joueur est déjà dans la table
    const isAlreadyInTable = table.players.some(player => player.userId.toString() === userId);
    if (!isAlreadyInTable) {
      table.players.push({ userId, playerName, selectedCharacter });
      await table.save();
    }

    // Ajouter la table à `tablesJoined` du joueur
    await User.findByIdAndUpdate(userId, { $addToSet: { tablesJoined: tableId } });

    res.status(200).json({ message: "Joueur ajouté à la table" });
  } catch (error) {
    console.error(error);
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
  const { characters, quest, other, items } = req.body;

  try {
    const table = await TableTop.findById(id);
    if (!table) return res.status(404).json({ message: "Table introuvable" });

    table.gameMasterNotes = { characters, quest, other, items };
    await table.save();

    res.json({ message: "Notes mises à jour avec succès", table });
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

    console.log("📌 Liste des joueurs récupérée depuis MongoDB :", table.players);

    res.status(200).json(table.players);
  } catch (error) {
    console.error("❌ Erreur serveur lors de la récupération des joueurs :", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};



// 📌 Supprimer un joueur d'une table
exports.removePlayerFromTable = async (req, res) => {
  const { tableId, userId } = req.params;
  console.log(`🗑️ BACKEND: Tentative de suppression du joueur ${userId} de la table ${tableId}`);

  try {
    const table = await TableTop.findById(tableId);
    if (!table) return res.status(404).json({ message: "Table non trouvée" });

    console.log("👀 Liste des joueurs AVANT suppression :", table.players);

    // 🔹 Vérification et correction de l'ID utilisateur
    const playerIndex = table.players.findIndex(
      (player) => player.userId.toString() === userId || player._id.toString() === userId
    );

    if (playerIndex === -1) {
      console.log(`❌ Joueur ${userId} introuvable dans la table !`);
      return res.status(404).json({ message: "Joueur non trouvé dans cette table" });
    }

    // ✅ Supprimer le joueur et l'ajouter à la liste des bannis
    const removedPlayer = table.players.splice(playerIndex, 1)[0];
    table.bannedPlayers.push(removedPlayer.userId.toString());

    // ✅ Supprimer la table de `tablesJoined` du joueur
    await User.findByIdAndUpdate(removedPlayer.userId, { $pull: { tablesJoined: tableId } });

    await table.save();
    console.log(`✅ Joueur ${removedPlayer.userId} supprimé et banni de la table ${tableId}`);
    res.status(200).json({ message: "Joueur supprimé avec succès" });

  } catch (error) {
    console.error("❌ Erreur lors de la suppression du joueur :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};



