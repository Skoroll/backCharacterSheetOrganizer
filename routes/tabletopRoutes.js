const express = require('express');
const tableController = require('../controllers/tableTopController'); // Correction de l'importation
const { protect } = require("../middlewares/authMiddleware");


const router = express.Router();

router.post('/tableCreate', protect, tableController.tableCreate);
router.get('/getTables', tableController.getTables);
router.get('/tables/:id', tableController.getTableById);
router.post('/verifyPassword/:id', tableController.verifyPassword); // Suppression de "protect"
router.post('/addPlayer/:tableId', protect, tableController.addPlayer);
router.delete('/tables/:id', protect, tableController.deleteTable);
router.put('/tables/:id/notes', protect, tableController.updateNotes);
router.get('/tables/:id/players', tableController.getPlayersFromTable);

// Importer la fonction removePlayerFromTable
router.delete('/tabletop/:tableId/removePlayer/:playerId', tableController.removePlayerFromTable);

module.exports = router;
