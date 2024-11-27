const User = require('../models/userModel');
const Task = require('../models/taskModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); // bcryptjs pour la gestion du mot de passe

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

    // Création de l'utilisateur sans avoir besoin de hacher le mot de passe ici
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

    // Dupliquer les tâches globales pour chaque pièce
    const globalTasks = await Task.find({ isGlobal: true }); // Récupérer toutes les tâches globales

    const userTasks = [];
    globalTasks.forEach(task => {
      // Pour chaque tâche globale, on la copie et on l'associe à l'utilisateur
      const newTask = new Task({
        name: task.name,
        description: task.description,
        time: task.time,
        frequency: task.frequency,
        what: task.what,
        room: task.room,
        isDone: task.isDone,
        isGlobal: false, // C'est maintenant une tâche spécifique à l'utilisateur, pas globale
        user: user._id, // Associe l'utilisateur à cette tâche
      });
      userTasks.push(newTask);
    });

    // Sauvegarder toutes les nouvelles tâches pour l'utilisateur
    await Task.insertMany(userTasks);

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
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({
      message: 'Connexion réussie',
      token,
      user: { id: user._id, email: user.email, name: user.name },
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
