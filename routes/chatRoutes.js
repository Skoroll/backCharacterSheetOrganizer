const express = require("express");
const { getMessages, postMessage } = require("../controllers/chatController");

const router = express.Router();

// Route pour récupérer les 20 derniers messages filtrés par tableId
router.get("/last20", getMessages);

// Route pour envoyer un message
router.post("/postChat", postMessage);

module.exports = router;
