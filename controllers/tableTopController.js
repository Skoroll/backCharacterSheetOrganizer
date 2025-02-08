const TableTop = require('../models/tabletopModel');

const bcrypt = require('bcrypt');

// Créer une nouvelle table
exports.tableCreate = async (req, res) => {
  const { name, password, gameMaster, gameMasterName } = req.body; // Récupération du nom

  if (!name || !password || !gameMaster || !gameMasterName) { // Vérification
    return res.status(400).json({ message: "Tous les champs sont obligatoires." });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const newTable = await TableTop.create({
      name,
      password: hashedPassword,
      gameMaster,
      gameMasterName,
      players: [{ playerId: gameMaster, hasEnteredPassword: true }], // Insérer un objet complet pour le joueur
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

// Récupérer toutes les tables
exports.getTables = async (req, res) => {
  try {
    const tables = await TableTop.find({}, "name");
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
    const table = await TableTop.findById(tableId);
    if (!table) {
      return res.status(404).json({ message: 'Table non trouvée' });
    }
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

  console.log("Table ID reçu :", tableId);  // Ajoutez cette ligne pour vérifier l'ID

  try {
    const table = await TableTop.findById(tableId);
    if (!table) {
      return res.status(404).json({ message: "Table non trouvée" });
    }

    const match = await bcrypt.compare(password, table.password);
    if (!match) {
      return res.status(400).json({ message: "Mot de passe incorrect" });
    }

    res.status(200).json({ message: "Mot de passe vérifié" });
  } catch (error) {
    console.error("Erreur lors de la vérification du mot de passe", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// Ajouter un joueur
exports.addPlayer = async (req, res) => {
  console.log("🔍 Requête reçue :", req.body);

  const { id: tableId } = req.params;
  const { playerId, playerName, selectedCharacter, password } = req.body;  // Récupération de selectedCharacter et password

  if (!playerId || !playerName || !selectedCharacter) {  // Vérification de selectedCharacter
    console.log("❌ Données utilisateur manquantes :", { playerId, playerName, selectedCharacter });
    return res.status(400).json({ message: "Données utilisateur manquantes" });
  }

  try {
    const table = await TableTop.findById(tableId);
    if (!table) {
      return res.status(404).json({ message: "Table non trouvée" });
    }

    // Vérifier si le joueur est déjà dans la table
    const existingPlayer = table.players.find(p => p.playerId?.toString() === playerId);
    if (existingPlayer) {
      return res.status(200).json({ message: "Retour sur la table", isNewPlayer: false });
    }

    // Vérification du mot de passe
    const match = await bcrypt.compare(password, table.password);
    if (!match) {
      return res.status(400).json({ message: "Mot de passe incorrect" });
    }

    // Ajouter le joueur avec le personnage sélectionné
    table.players.push({ playerId, playerName, selectedCharacter });  // Ajout de selectedCharacter
    await table.save();

    res.status(200).json({ message: "Bienvenue sur la table", isNewPlayer: true });
  } catch (err) {
    console.error("❌ Erreur lors de l'ajout du joueur :", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};


//Supprime une table
exports.deleteTable = async (req, res) => {
  const tableId = req.params.id;

  try {
    const table = await TableTop.findById(tableId);
    if (!table) {
      return res.status(404).json({ message: "Table non trouvée" });
    }

    await table.deleteOne();
    res.status(200).json({ message: "Table supprimée avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression de la table", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.updateNotes = async (req, res) => {
  const { id } = req.params;
  const { characters, quest, other, items } = req.body;

  try {
    const table = await TableTop.findById(id);
    if (!table) {
      return res.status(404).json({ message: "Table introuvable" });
    }

    // Mise à jour des notes
    table.gameMasterNotes = { characters, quest, other, items };
    await table.save();

    res.json({ message: "Notes mises à jour avec succès", table });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// Récupérer les joueurs d'une table
exports.getPlayersFromTable = async (req, res) => {
  const tableId = req.params.id;
  console.log("Requête reçue pour la table ID :", tableId);
  try {
    const table = await TableTop.findById(tableId)
      .populate({
        path: 'players.selectedCharacter', // Populer le champ selectedCharacter pour chaque joueur
        select: 'name image' // Sélectionner uniquement les champs dont on a besoin
      });

    if (!table) {
      return res.status(404).json({ message: 'Table non trouvée' });
    }

    console.log("Joueurs de la table avec personnages peuplés :", table.players);
    res.status(200).json(table.players);
  } catch (error) {
    console.error("Erreur serveur", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};







