//userController.js
const User = require('../models/userModel');
const Task = require('../models/taskModel'); // Modèle pour les tâches globales
const UserMadeTask = require('../models/userMadeTaskModel'); // Modèle pour les tâches utilisateurs
const jwt = require('jsonwebtoken');


// Fonction pour l'inscription d'un utilisateur
exports.register = async (req, res) => {
  try {
    const { name, email, password, rooms, equipments } = req.body;

    console.log('Données reçues lors de l\'inscription:', { name, email, password, rooms, equipments });

    if (!name || !email || !password || !rooms) {
      return res.status(400).json({ message: "Champs requis manquants." });
    }

    // Vérification de l'unicité de l'email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('Utilisateur déjà existant avec cet email:', email);
      return res.status(400).json({ message: "Cet email est déjà utilisé." });
    }

    // Création de l'utilisateur
    const user = new User({
      name,
      email,
      password, // Le mot de passe est maintenant en clair, il sera haché dans le modèle
      profileImage: req.file ? req.file.path.replace(/\\/g, '/') : null,
      rooms: JSON.parse(rooms),
      equipments: JSON.parse(equipments || "[]"),
    });

    await user.save();
    console.log('Utilisateur créé:', user);

    // Dupliquer les tâches globales pour chaque pièce dans UserMadeTask
    const globalTasks = await Task.find({ isGlobal: true }); // Récupérer toutes les tâches globales

    const userTasks = globalTasks.map(task => ({
      name: task.name, // Adapte si le champ est différent
      description: task.description,
      time: task.time,
      frequency: task.frequency,
      what: task.what,
      room: task.room,
      isDone: task.isDone,
      isGlobal: false, // Marquer comme non-global
      user: user._id, // Associer à l'utilisateur créé
    }));

    // Sauvegarder les tâches dans UserMadeTask
    await UserMadeTask.insertMany(userTasks);

    res.status(201).json({ message: "Utilisateur créé avec succès et tâches globales attribuées !" });
  } catch (error) {
    console.error("Erreur lors de l'inscription :", error);
    res.status(500).json({ message: "Erreur interne du serveur." });
  }
};


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

exports.updateUser = async (req, res) => {
  console.log("Requête de mise à jour de profil :",  req.user)
  try {
    const userId = req.user.id; // Identifiant de l'utilisateur connecté (authMiddleware requis)
    const { name, email, rooms, equipments } = req.body;

    // Préparer les mises à jour
    const updates = {
      ...(name && { name }),
      ...(email && { email }),
      ...(rooms && { rooms: JSON.parse(rooms) }),
      ...(equipments && { equipments: JSON.parse(equipments) }),
    };

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
