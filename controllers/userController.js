const User = require('../models/userModel');
const Task = require('../models/taskModel'); // Modèle pour les tâches globales
const UserMadeTask = require('../models/userMadeTaskModel'); // Modèle pour les tâches utilisateurs
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const uploadMiddleware = require('../middlewares/uploadMiddleware');  // Assure-toi que le chemin est correct
const fs = require('fs');
const path = require('path');
const userService = require('../services/userServices');


// Vérifier et créer le répertoire `uploads` si nécessaire
const uploadDir = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Fonction pour l'inscription d'un utilisateur
exports.register = async (req, res) => {
  const { name, email, password, rooms } = req.body;
  
  // Validation des données requises
  if (!name || !email || !password) {
    return res.status(400).json({ message: "Les champs 'name', 'email' et 'password' sont obligatoires." });
  }

  let parsedRooms = [];
  if (rooms) {
    try {
      parsedRooms = JSON.parse(rooms); // Parse JSON si fourni
    } catch (error) {
      return res.status(400).json({ message: "Le champ 'rooms' doit être un JSON valide." });
    }
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10); // Hashage sécurisé du mot de passe

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      rooms: parsedRooms,
      profileImage: req.file ? req.file.path.replace(/\\/g, '/') : null,
    });

    await userService.createUserTasks(newUser._id); // Duplication des tâches globales pour l'utilisateur

    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      user: { id: newUser._id, name: newUser.name, email: newUser.email },
    });
  } catch (err) {
    console.error("Erreur complète lors de la création de l'utilisateur :", err);
    if (err.code === 11000) { // Gestion d'un email dupliqué
      return res.status(409).json({ message: "Un utilisateur avec cet email existe déjà." });
    }
    res.status(500).json({ message: "Une erreur est survenue lors de la création de l'utilisateur." });
  }
};


// Fonction pour la connexion d'un utilisateur
exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Les champs 'email' et 'password' sont obligatoires." });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
    }

    const match = await bcrypt.compare(password.trim(), user.password);
    if (!match) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.status(200).json({
      message: 'Connexion réussie',
      token,
      user: { id: user._id, name: user.name, email: user.email, profileImage: user.profileImage },
    });
  } catch (err) {
    console.error('Erreur dans la connexion :', err);
    res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
};


// Fonction pour récupérer les informations de l'utilisateur connecté
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    res.status(200).json({
      message: 'Utilisateur récupéré avec succès',
      user,
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Fonction pour la modification du profil
exports.updateUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, password, rooms } = req.body;
    console.log("Données reçues:", req.body); // Log pour vérifier les données envoyées
    console.log("Fichier reçu:", req.file); // Log pour vérifier le fichier reçu
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }

    // Supprimer l'ancienne image de profil si elle existe et si une nouvelle image est fournie
    if (req.file && user.profileImage) {
      const oldImagePath = path.join(__dirname, '..', user.profileImage);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath); // Supprimer l'ancienne image
      }
    }

    // Préparer les mises à jour
    const updates = {
      ...(name && { name }),
      ...(email && { email }),
      ...(rooms && { rooms: JSON.parse(rooms) }),
    };
    
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(password, salt);
    }
    
    if (req.file) {
      updates.profileImage = req.file.path.replace(/\\/g, '/');
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updates,
      { new: true, runValidators: true }
    ).select('-password'); // Exclure le mot de passe du retour

    if (!updatedUser) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }

    res.status(200).json({
      message: 'Profil mis à jour avec succès.',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour :', error);
    res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
};


// Fonction pour supprimer un utilisateur et ses tâches
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.user.id; // Identifiant de l'utilisateur connecté (authMiddleware requis)

    // Vérifie si l'utilisateur existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable." });
    }

    // Supprimer l'image de profil de l'utilisateur si elle existe
    if (user.profileImage) {
      const imagePath = path.join(__dirname, '..', user.profileImage);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath); // Supprimer l'image
      }
    }

    // Supprime les tâches associées à l'utilisateur
    const tasksToDelete = await UserMadeTask.deleteMany({ user: userId });
    console.log(`Tâches supprimées : ${tasksToDelete.deletedCount}`);

    // Supprime l'utilisateur
    await User.findByIdAndDelete(userId);

    res.status(200).json({ message: "Utilisateur et ses tâches supprimés avec succès." });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'utilisateur :", error);
    res.status(500).json({ message: "Erreur interne du serveur." });
  }
};

