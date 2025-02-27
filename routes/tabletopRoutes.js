const express = require('express');
const tableController = require('../controllers/tableTopController'); 
const { protect } = require("../middlewares/authMiddleware");
const { uploadGmFile, convertToWebp } = require("../middlewares/multer-config");


const router = express.Router();

router.post('/tableCreate', protect, tableController.tableCreate);
router.get('/getTables', tableController.getTables);
router.get('/tables/:id', tableController.getTableById);
router.post('/verifyPassword/:id', tableController.verifyPassword);
router.post('/addPlayer/:tableId', protect, tableController.addPlayer);
router.delete('/tables/:id', protect, tableController.deleteTable);
router.put("/tables/:id/notes", tableController.updateNotes);
router.get('/tables/:id/players', tableController.getPlayersFromTable);
router.delete('/tables/:tableId/removePlayer/:userId', tableController.removePlayerFromTable);
router.delete('/tables/:tableId/removeCharacter/:userId', tableController.removePlayerCharacter);
router.post("/selectCharacter", tableController.selectCharacterForPlayer);
router.put("/tables/:id/player-notes", tableController.updatePlayerNotes);
router.get("/tables/:id/player-notes", tableController.getPlayerNotes);
router.get('/tables', tableController.getTables);
router.get("/tables/:id/notes", tableController.getGameMasterNotes);
router.put("/tables/:id/style", uploadGmFile.array("bannerImage", 1), convertToWebp, tableController.updateTableStyle);




module.exports = router;


