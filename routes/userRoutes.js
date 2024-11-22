// routes/userRoutes.js
const express = require("express");
const router = express.Router();
const upload = require("../middlewares/uploadMiddleware"); // Importation du middleware d'upload
const userController = require("../controllers/userController");
const { protect } = require("../middlewares/authMiddleware");

// Route pour l'inscription
router.post(
  "/register",
  upload.single("profileImage"),
  (req, res, next) => {
    console.log("Requête d'inscription reçue");
    console.log("Données envoyées:", req.body);
    console.log("Image de profil:", req.file ? req.file.path : "Aucune image");
    next();
  },
  userController.register
);

// Route pour la connexion
router.post(
  "/login",
  (req, res, next) => {
    console.log("Requête de connexion reçue");
    console.log("Données envoyées:", req.body);
    next();
  },
  userController.login
);

// Route pour récupérer le profil d'un utilisateur connecté (GET)
router.get("/profile", protect, userController.getProfile);

module.exports = router;
