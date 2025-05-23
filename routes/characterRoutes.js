const express = require('express');
const multer = require("multer");
const checkCharacterLimit = require('../middlewares/checkCharacterLimit');
const { protect } = require('../middlewares/authMiddleware');

const { 
  createCharacterAria,
  getAllCharacters,
  getCharacterById,
  updateCharacterAria,
  deleteCharacter,
  getUserCharacters,
  getCharactersByUser,
  updateHealth,
  drawAriaCard,
  updateDeathMagic,
  updateGold,
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


// Route pour récupérer uniquement les personnages de l'utilisateur connecté
router.get("/user", protect, (req, res, next) => {

  next();
}, getUserCharacters);

// Route pour récupérer tous les personnages
router.get("/", (req, res, next) => {

  next();
}, getAllCharacters);


////////////////////////////
////////////ARIA////////////
////////////////////////////

// Route pour créer un personnage avec upload de fichier
router.post("/aria", protect, checkCharacterLimit, upload.single("image"), createCharacterAria);

// Route pour mettre à jour un personnage
router.put("/aria/:id", upload.single("image"), updateCharacterAria);

router.put("/:id/drawAriaCard", drawAriaCard);

router.patch("/:id/update-death-magic", updateDeathMagic);



////////////////////////////
///////////Général//////////
////////////////////////////

// Route pour récupérer un personnage par son ID
router.get("/:id", getCharacterById);

router.get("/characters", protect, getCharactersByUser);

//Modifie la vie à la volée
router.patch("/:id/update-health", updateHealth);

// Route pour supprimer un personnage
router.delete("/:id", deleteCharacter);

//Mise à jour de l'or
router.patch("/:id/update-gold", updateGold);


module.exports = router;
