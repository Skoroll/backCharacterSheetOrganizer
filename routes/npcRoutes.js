const express = require("express");
const npcController = require("../controllers/npcController");

const router = express.Router();

router.post("/npcs", npcController.createNpc);
router.get("/npcs/:tableId", npcController.getNpcsByTable);
router.delete("/npcs/:id", npcController.deleteNpc);
module.exports = router;
