const express = require('express');
const multer = require('multer'); // Importez multer
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');
const uploadMiddleware = require('../middlewares/uploadMiddleware'); // Importer le middleware

// Route pour l'inscription
router.post('/register', uploadMiddleware, userController.register);
  
// Route pour la connexion
router.post('/login', userController.login);

// Route pour récupérer le profil d'un utilisateur connecté
router.get('/profile', protect, userController.getProfile);

// Route pour mettre à jour les données d'un utilisateur
router.put('/update', protect, uploadMiddleware, userController.updateUser);

// Route pour supprimer un utilisateur
router.delete('/delete', protect, userController.deleteUser);

module.exports = router;
