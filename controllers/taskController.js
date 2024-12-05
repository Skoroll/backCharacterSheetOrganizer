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
exports.validateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ message: 'Tâche non trouvée' });
    }
    task.completed = true;
    await task.save();
    res.status(200).json({ message: 'Tâche validée', task });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la validation de la tâche', error });
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
