// routes/chat.js
const express = require('express');
const Chat = require('../models/Chat');
const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();
const Message = require('../models/Chat');

// Constante pour le nombre maximum de messages
const MAX_MESSAGES = 20;

// Route pour envoyer un message dans le chat
router.post('/postChat', async (req, res) => {
    console.log('Requête reçue avec le corps:', req.body); // Log des données reçues

    try {
        const newMessage = new Message(req.body);
        const savedMessage = await newMessage.save();
        console.log('Message enregistré avec succès:', savedMessage); // Log de la réponse après sauvegarde
        await cleanupOldMessages(); // Appeler la fonction de nettoyage après l'envoi d'un nouveau message
        res.status(201).json(savedMessage);
    } catch (error) {
        console.error('Erreur lors de la sauvegarde du message:', error); // Log d'erreur
        res.status(500).json({ message: 'Erreur interne du serveur' });
    }
});

// Route pour récupérer les 20 derniers messages
router.get('/last20', async (req, res) => {
    try {
        const messages = await Chat.find().sort({ createdAt: -1 }).limit(20); // Remplacez 'createdAt' par le champ de timestamp approprié dans votre modèle
        res.status(200).json(messages.reverse()); // Retourner les messages dans le bon ordre
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération des messages', error });
    }
});

// Route pour se connecter
router.post('/login', async (req, res) => {
    const { pseudo, password } = req.body;

    try {
        const user = await User.findOne({ pseudo });

        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: 'Mot de passe incorrect' });
        }

        // Créer un token JWT
        const token = jwt.sign({ id: user._id, pseudo: user.pseudo }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({ token, message: 'Connexion réussie' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la connexion', error });
    }
});

// Fonction pour nettoyer les anciens messages
const cleanupOldMessages = async () => {
    try {
        const messages = await Message.find().sort({ createdAt: 1 }); // Trier les messages par date croissante

        if (messages.length > MAX_MESSAGES) {
            const messagesToDelete = messages.length - MAX_MESSAGES;
            const idsToDelete = messages.slice(0, messagesToDelete).map(message => message._id);
            await Message.deleteMany({ _id: { $in: idsToDelete } }); // Supprimer les anciens messages
            console.log(`Supprimé ${messagesToDelete} anciens messages.`);
        } else {
            console.log(`Nombre de messages (${messages.length}) est dans la limite.`);
        }
    } catch (error) {
        console.error('Erreur lors de la suppression des anciens messages :', error);
    }
};

module.exports = router;
