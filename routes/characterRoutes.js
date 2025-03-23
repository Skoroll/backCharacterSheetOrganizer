const express = require('express');
const multer = require("multer");
const { protect } = require('../middlewares/authMiddleware');

const { 
  createCharacter,
  getAllCharacters,
  getCharacterById,
  updateCharacter,
  deleteCharacter,
  getUserCharacters,
  getCharactersByUser,
  updateHealth
} = require('../controllers/characterController');


const router = express.Router();

// Configuration de Multer pour gérer l'upload des fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Assure-toi que ce dossier existe
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname); // Renommer le fichier pour éviter les conflits
  },
});

const upload = multer({ storage });


// 🔹 Route pour récupérer uniquement les personnages de l'utilisateur connecté
router.get("/user", protect, (req, res, next) => {

  next();
}, getUserCharacters);

// 🔹 Route pour récupérer tous les personnages
router.get("/", (req, res, next) => {

  next();
}, getAllCharacters);

// 🔹 Route pour créer un personnage avec upload de fichier
router.post("/", protect, upload.single("image"), createCharacter);

router.patch("/:id/update-health", updateHealth);

// 🔹 Route pour récupérer un personnage par son ID
router.get("/:id", getCharacterById);

// 🔹 Route pour mettre à jour un personnage
router.put("/:id", upload.single("image"), updateCharacter);

router.get("/characters", protect, getCharactersByUser);


// 🔹 Route pour supprimer un personnage
router.delete("/:id", deleteCharacter);

module.exports = router;
