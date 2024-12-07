const express = require('express');
const router = express.Router();
const { upload } = require('../middlewares/uploadMiddleware');
const userController = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');

// Route pour l'inscription
router.post('/register', upload.single('profileImage'), userController.register);

// Route pour la connexion
router.post('/login', userController.login);

// Route pour récupérer le profil d'un utilisateur connecté
router.get('/profile', protect, userController.getProfile);

// Route pour mettre à jour les données d'un utilisateur
router.put('/update', protect, upload.single('profileImage'), userController.updateUser);

// Route pour supprimer un utilisateur
router.delete('/delete', protect, userController.deleteUser);

module.exports = router;
