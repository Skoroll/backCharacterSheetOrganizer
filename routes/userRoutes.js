const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');
const uploadMiddleware = require('../middlewares/uploadMiddleware');

router.post('/register', userController.register);
router.post('/login', userController.login);
router.get('/profile', authMiddleware.protect, userController.getProfile);
router.put('/profile', authMiddleware.protect, uploadMiddleware.single('profileImage'), userController.updateUser);
router.delete('/profile', authMiddleware.protect, userController.deleteUser);
router.get('/users/:id', userController.getUserById);
router.get('/players', userController.getPlayersByIds);

// 📩 Récupération de mot de passe
router.post("/forgot-password", userController.forgotPassword);
router.get("/reset-password/:token", userController.verifyResetToken);
router.post("/reset-password/:token", userController.resetPasswordRequest);

module.exports = router;
