const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');
const uploadMiddleware = require('../middlewares/uploadMiddleware');

router.post('/register', userController.register);
router.post('/login', userController.login);
router.get('/profile', authMiddleware.protect, userController.getProfile);
router.get('/profile/:id', userController.getUserProfileById);
router.put('/profile', authMiddleware.protect, uploadMiddleware.single('profileImage'), userController.updateUser);
router.delete('/profile', authMiddleware.protect, userController.deleteUser);
router.get('/users/:id', userController.getUserById);
router.get('/players', userController.getPlayersByIds);
router.get('/users/:id/tables-detailed', userController.getUserTablesDetailed);

// Récupération de mot de passe
router.post("/forgot-password", userController.forgotPassword);
router.get("/reset-password/:token", userController.verifyResetToken);
router.post("/reset-password/:token", userController.resetPasswordRequest);

// Rafraichissement du token
router.post("/refresh-token", userController.refreshToken);
router.post('/logout', authMiddleware.protect, userController.logout);

//Retire les tables inexistantes d'un utilisateur
router.patch("/removeTable/:tableId", authMiddleware.protect, userController.removeTableFromUser);

// Route pour recevoir le webhook Ko-fi
router.post('/webhook', userController.handleKofiWebhook);

//Route pour autoriser l'utilisateur à se connecter
router.get('/me', authMiddleware.protect, userController.getProfile);


module.exports = router;
