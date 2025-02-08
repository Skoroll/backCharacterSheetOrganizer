const express = require('express');
const tableController = require('../controllers/tableTopController');
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post('/tableCreate', protect, tableController.tableCreate);
router.get('/getTables',  tableController.getTables);
router.get('/tables/:id', tableController.getTableById);
router.post('/verifyPassword/:id', protect, tableController.verifyPassword);
router.post('/addPlayer/:id', protect, tableController.addPlayer);
router.delete('/tables/:id', protect, tableController.deleteTable);
router.put('/tables/:id/notes', protect, tableController.updateNotes);
router.get('/tables/:id/players', tableController.getPlayersFromTable);
router.get('/test', (req, res) => {
    console.log('Route test atteinte');
    res.status(200).json({ message: "Test réussi !" });
  });

module.exports = router;
