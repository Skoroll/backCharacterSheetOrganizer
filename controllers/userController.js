const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const uploadMiddleware = require('../middlewares/uploadMiddleware');  // Assure-toi que le chemin est correct
const fs = require('fs');
const path = require('path');

// Vérifier et créer le répertoire `uploads` si nécessaire
const uploadDir = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Fonction pour l'inscription d'un utilisateur
exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Les champs 'name', 'email' et 'password' sont obligatoires." });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    res.status(201).json({
      message: "Utilisateur créé avec succès.",
      user: { id: newUser._id, email: newUser.email, name: newUser.name },
    });
  } catch (err) {
    console.error("Erreur lors de la création de l'utilisateur :", err);
    if (err.code === 11000) {
      return res.status(409).json({ message: "Un utilisateur avec cet email existe déjà." });
    }
    res.status(500).json({ message: "Erreur interne du serveur." });
  }
};

// Fonction pour la connexion d'un utilisateur
exports.login = async (req, res) => {
  console.log("Requête reçue :", req.body);
  const { email, password } = req.body;
  if (!email || !password) {
    console.log("Données manquantes :", { email, password });
    return res.status(400).json({ message: "Les champs 'email' et 'password' sont obligatoires." });
  }

  try {
    // Récupération de l'utilisateur en base de données
    const user = await User.findOne({ email });

    if (!user) {
      console.log("Utilisateur non trouvé :", email);
      return res.status(401).json({ message: "Email ou mot de passe incorrect." });
    }

    const match = await bcrypt.compare(password.trim(), user.password);
    console.log("Mot de passe correct :", match);
    if (!match) {
      console.log("Mot de passe incorrect :", password, "Attendu :", user.password);
      return res.status(401).json({ message: "Email ou mot de passe incorrect." });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.status(200).json({
      message: 'Connexion réussie',
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error("Erreur lors de la connexion :", err);
    res.status(500).json({ message: "Erreur interne du serveur." });
  }
};


// Fonction pour récupérer plusieurs utilisateurs par leurs IDs
exports.getPlayersByIds = async (req, res) => {
  const playerIds = req.query.ids.split(','); // Récupère les IDs depuis la query string

  try {
    // Recherche les utilisateurs avec les IDs fournis
    const players = await User.find({ '_id': { $in: playerIds } }).select('-password');

    if (!players || players.length === 0) {
      return res.status(404).json({ message: 'Aucun joueur trouvé.' });
    }

    res.status(200).json(players); // Retourne les joueurs trouvés
  } catch (error) {
    console.error('Erreur lors de la récupération des joueurs :', error);
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
    const { name, email, password, oldPassword } = req.body; // Ajout du `oldPassword`
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }

    // Vérifier et modifier le mot de passe si nécessaire
    if (password) {
      // Vérifier si l'ancien mot de passe est correct
      if (!oldPassword) {
        return res.status(400).json({ message: 'L\'ancien mot de passe est requis.' });
      }
      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'L\'ancien mot de passe est incorrect.' });
      }
    
      // Hacher le nouveau mot de passe avant de le sauvegarder
      user.password = await bcrypt.hash(password, 10);
    }
    // Préparer les mises à jour
    const updates = {
      ...(name && { name }),
      ...(email && { email }),
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

    // Supprime l'utilisateur
    await User.findByIdAndDelete(userId);

    res.status(200).json({ message: "Utilisateur et ses tâches supprimés avec succès." });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'utilisateur :", error);
    res.status(500).json({ message: "Erreur interne du serveur." });
  }
};


// Fonction pour récupérer un utilisateur spécifique par son ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur :', error);
    res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
};

