// controllers/taskController.js
const Task = require('../models/userMadeTaskModel');


// Créer une nouvelle tâche
exports.createTask = async (req, res) => {
  try {
    console.log('Données reçues dans le backend:', req.body); // Vérifie la structure de la requête

    const { name, description, time, what = [], frequency, room } = req.body;

    // Assure-toi que "what" contient bien un tableau non vide
    console.log('Valeur de what avant d\'enregistrer:', what); 

    if (!name || !description || !time || !frequency || !room) {
      return res.status(400).json({ message: 'Tous les champs requis doivent être remplis.' });
    }

    if (!req.user) {
      return res.status(401).json({ message: 'Utilisateur non authentifié' });
    }

    const newTask = new Task({
      name,
      description,
      time,
      what,  // Utilisation de "what" tel quel
      frequency,
      room,
      user: req.user._id,
    });

    await newTask.save();
    console.log('Tâche sauvegardée dans la base de données:', newTask);
    res.status(201).json(newTask);
  } catch (error) {
    console.error('Erreur lors de la création de la tâche:', error);
    res.status(500).json({ message: 'Erreur lors de la création de la tâche', error });
  }
};


// Valider une tâche
const calculateResetTime = (frequency) => {
  const now = new Date();
  switch (frequency) {
    case 'Quotidienne':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000); // +1 jour
    case 'Hebdomadaire':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // +7 jours
    case 'Mensuelle':
      return new Date(now.setMonth(now.getMonth() + 1)); // +1 mois
    default:
      return null; // Cas par défaut
  }
};

exports.validateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ message: 'Tâche non trouvée' });
    }

    // Valider la tâche
    task.isDone = true;
    task.dateDone = new Date();
    task.resetTimer = calculateResetTime(task.frequency);
    await task.save();

    res.status(200).json({ message: 'Tâche validée avec succès', task });
  } catch (error) {
    console.error('Erreur lors de la validation de la tâche:', error);
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

exports.unValidateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ message: 'Tâche non trouvée' });
    }

    // Dévalider la tâche
    task.isDone = false;
    task.dateDone = null; // Utilisez null au lieu de ""
    task.resetTimer = null; // Utilisez null au lieu de ""
    task.lastCompleted = null; // Facultatif, selon vos besoins
    task.nextDue = null; // Facultatif, à recalculer si nécessaire
    await task.save();

    res.status(200).json({ message: 'Tâche dévalidée avec succès', task });
  } catch (error) {
    console.error('Erreur lors de la dévalidation de la tâche:', error);
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

// Obtenir toutes les tâches d'un utilisateur
exports.getUserTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user._id });
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des tâches', error });
  }
};

// Obtenir les tâches par pièce ou toutes les tâches si aucune pièce n'est spécifiée
exports.getTasksByRoom = async (req, res) => {
  const { room } = req.query; // Extraire la pièce depuis les paramètres de requête
  try {
    // Si room est spécifiée, filtre sur la pièce sinon récupère toutes les tâches
    const tasks = await UserMadeTask.find(room ? { room } : {});
    res.status(200).json(tasks);
  } catch (error) {
    console.error('Erreur lors de la récupération des tâches par pièce:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des tâches' });
  }
};


