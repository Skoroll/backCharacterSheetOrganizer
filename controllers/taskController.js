// controllers/taskController.js
const Task = require('../models/userMadeTaskModel');


// Créer une nouvelle tâche
exports.createTask = async (req, res) => {
  try {
    const { name, description, time, equipment, frequency } = req.body;
    const newTask = new Task({
      name,
      description,
      time,
      equipment,
      frequency,
      user: req.user._id, // Utilisateur authentifié
    });
    await newTask.save();
    res.status(201).json(newTask);
  } catch (error) {
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



