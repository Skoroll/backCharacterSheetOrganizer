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


module.exports = router;
