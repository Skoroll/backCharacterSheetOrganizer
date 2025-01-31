const express = require('express');
const userController = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');
const router = express.Router();

// Route pour l'inscription
router.post('/register', userController.register);

// Route pour la connexion
router.post('/login', userController.login);

// Route pour récupérer le profil de l'utilisateur connecté
router.get('/profile', protect, userController.getProfile);

// Route pour mettre à jour le profil de l'utilisateur
router.put('/update', protect, userController.updateUser);

// Route pour supprimer l'utilisateur
router.delete('/delete', protect, userController.deleteUser);

module.exports = router;
