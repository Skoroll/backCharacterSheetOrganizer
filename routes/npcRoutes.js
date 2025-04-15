const express = require("express");
const router = express.Router();
const { uploadGmFile } = require("../middlewares/multer-config");
const npcController = require("../controllers/npcController");

router.post("/npcs", uploadGmFile.single("image"), npcController.createNpc);
router.get("/npcs/:tableId", npcController.getNpcsByTable);
router.delete("/npcs/:id", npcController.deleteNpc);
router.put("/npcs/:id", npcController.updateNpc);

module.exports = router;
