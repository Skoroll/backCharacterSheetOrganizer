// routes/chatRoutes.js
const express = require("express");
const { getMessages, postMessage } = require("../controllers/chatController");

const router = express.Router();

router.get("/last20", getMessages); // Route pour récupérer les 20 derniers messages
router.post("/postChat", postMessage); // Route pour envoyer un message

module.exports = router;
