const express = require('express');
const {
  createCharacter,
  getCharacterById,
  getAllCharacters,
  updateCharacter,
  deleteCharacter,
} = require('../controllers/characterController');

const router = express.Router();

// 🔹 Route pour créer un personnage
router.post("/", createCharacter);

// 🔹 Route pour récupérer tous les personnages
router.get("/", getAllCharacters);

// 🔹 Route pour récupérer un personnage par son ID
router.get("/:id", getCharacterById);

// 🔹 Route pour mettre à jour un personnage
router.put("/:id", updateCharacter);

// 🔹 Route pour supprimer un personnage
router.delete("/:id", deleteCharacter);

module.exports = router;  // Exportation correcte
