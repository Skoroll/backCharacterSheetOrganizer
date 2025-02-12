const TableTop = require('../models/tabletopModel');
const User = require("../models/userModel");
const bcrypt = require('bcrypt');

// Créer une nouvelle table
exports.tableCreate = async (req, res) => {
  const { name, password, game, gameMaster, gameMasterName } = req.body;

  if (!name || !password || !gameMaster || !gameMasterName) {
    return res.status(400).json({ message: "Tous les champs sont obligatoires." });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    // Création de la table et assignation de isGameMaster: true au créateur
    const newTable = await TableTop.create({
      name,
      password: hashedPassword,
      game,
      gameMaster,
      gameMasterName,
      players: [{ playerId: gameMaster, playerName: gameMasterName, isGameMaster: true }],
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


// Récupérer toutes les tables avec les joueurs
exports.getTables = async (req, res) => {
  try {
    const tables = await TableTop.find({}, "name game players") // On récupère aussi la propriété players
      .populate('players.playerId', 'playerName selectedCharacter') // On peuple les players avec leurs infos (par exemple playerName et selectedCharacter)
      .exec();  // Exécution de la requête

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
      res.status(400).json({ message: "Mot de passe incorrect" });
      return;
    }

    res.status(200).json({ message: "Mot de passe vérifié" });
  } catch (error) {
    console.error("Erreur lors de la vérification du mot de passe", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// Ajouter un joueur
exports.addPlayer = async (req, res) => {
  const { tableId } = req.params;
  const { playerId, playerName, selectedCharacter } = req.body;

  try {
    const table = await TableTop.findById(tableId);
    if (!table) return res.status(404).json({ message: "Table introuvable" });

    // Vérifier si le joueur est déjà dans la table
    const isAlreadyInTable = table.players.some(
      (player) => player.playerId.toString() === playerId
    );

    if (!isAlreadyInTable) {
      // Ajouter le joueur à la liste des joueurs de la table
      table.players.push({ playerId, playerName, selectedCharacter });
      await table.save();
    }

    // Ajouter l'_id de la table au profil du joueur
    await User.findByIdAndUpdate(playerId, {
      $addToSet: { tablesJoined: tableId } // Évite les doublons
    });

    res.status(200).json({ message: "Joueur ajouté à la table" });
  } catch (error) {
    console.error(error);
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
      path: 'players.selectedCharacter',
      select: '-__v'
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

// Supprimer un joueur d'une table
exports.removePlayerFromTable = async (req, res) => {
  console.log(`Suppression du joueur avec l'ID: ${playerId}, Table ID: ${tableId}`);
  try {
    const response = await fetch(`${API_URL}/api/tabletop/${tableId}/removePlayer/${playerId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      console.error(`Erreur lors de la suppression du joueur, statut: ${response.status}`);
      throw new Error(`Erreur lors de la suppression du joueur, statut: ${response.status}`);
    }

    console.log(`Joueur ${playerId} supprimé avec succès.`);
  } catch (error) {
    console.error('Erreur lors de la suppression du joueur', error);
  }
}