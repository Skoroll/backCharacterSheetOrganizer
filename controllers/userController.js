//userController.js
const User = require('../models/userModel');
const Task = require('../models/taskModel'); // Modèle pour les tâches globales
const UserMadeTask = require('../models/userMadeTaskModel'); // Modèle pour les tâches utilisateurs
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { upload, convertToWebpWithResize } = require('../middlewares/uploadMiddleware');



// Fonction pour l'inscription d'un utilisateur
exports.register = [
  upload.single('profileImage'), // Middleware pour gérer l'upload
  convertToWebpWithResize,      // Middleware pour convertir l'image
  async (req, res) => {
    try {
      const { name, email, password, rooms, equipments } = req.body;

      if (!name || !email || !password || !rooms) {
        return res.status(400).json({ message: "Champs requis manquants." });
      }

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "Cet email est déjà utilisé." });
      }

      const user = new User({
        name,
        email,
        password,
        profileImage: req.file ? req.file.path.replace(/\\/g, '/') : null, // Chemin du fichier transformé
        rooms: JSON.parse(rooms),
        equipments: JSON.parse(equipments || "[]"),
      });

      await user.save();
      res.status(201).json({ message: "Utilisateur créé avec succès !" });
    } catch (error) {
      console.error("Erreur lors de l'inscription :", error);
      res.status(500).json({ message: "Erreur interne du serveur." });
    }
  },
];



// Fonction pour la connexion d'un utilisateur
exports.login = async (req, res) => {
  const { email, password } = req.body;

  console.log('Données reçues lors de la connexion:', { email, password });

  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.log('Aucun utilisateur trouvé avec cet email:', email);
      return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
    }
    
    console.log('Utilisateur trouvé:', user);  // Affiche l'utilisateur trouvé
    console.log('Mot de passe envoyé (en clair):', password);  // Mot de passe envoyé
    console.log('Mot de passe en base de données:', user.password);  // Mot de passe en clair dans la DB

    // Comparaison des mots de passe en utilisant la méthode matchPassword
    const match = await user.matchPassword(password.trim());

    console.log('Mot de passe envoyé:', password);
    console.log('Mot de passe haché dans la base de données:', user.password);
    console.log('Match:', match); // Devrait afficher true si tout est bien configuré
    
    if (!match) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET
    );

    res.status(200).json({
      message: 'Connexion réussie',
      token,
      user: { id: user._id, email: user.email, name: user.name,  profileImage: user.profileImage  },
    });
  } catch (err) {
    console.error('Erreur dans la connexion :', err);
    res.status(500).json({ message: 'Erreur interne du serveur' });
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
    
    const userId = req.user.id; // Identifiant de l'utilisateur connecté (authMiddleware requis)
    const { name, email, password, rooms, equipments } = req.body;
    console.log("Password reçu :", password);
    // Préparer les mises à jour
    const updates = {
      ...(name && { name }),
      ...(email && { email }),
      ...(rooms && { rooms: JSON.parse(rooms) }),
      ...(equipments && { equipments: JSON.parse(equipments) }),
    };

    if (password) {
      console.log("Hachage en cours...");
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(password, salt);
      console.log("Mot de passe haché :", updates.password);
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
    console.log("Mises à jour préparées :", updates);
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
