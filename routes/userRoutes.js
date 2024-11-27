const express = require('express');
const router = express.Router();
const upload = require('../middlewares/uploadMiddleware'); // Middleware d'upload d'images
const userController = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');

// Route pour l'inscription
router.post('/register', upload.single('profileImage'), userController.register);

// Route pour la connexion
router.post('/login', userController.login);

// Route pour récupérer le profil d'un utilisateur connecté
router.get('/profile', protect, userController.getProfile);

module.exports = router;
