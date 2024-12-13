const mongoose = require('mongoose');
const Task = require('../models/taskModel');
const UserMadeTask = require('../models/userMadeTaskModel');

exports.createUserTasks = async (userId) => {
  try {
    // Récupérer toutes les tâches globales
    const tasks = await Task.find({ isGlobal: true }); // Filtrer uniquement les tâches globales

    // Créer des copies de ces tâches pour l'utilisateur avec un nouvel ID
    const userMadeTasks = tasks.map(task => ({
      ...task.toObject(), // Copie des champs de la tâche
      user: userId,       // Associer l'utilisateur
      _id: new mongoose.Types.ObjectId(), // Nouvel ID pour la tâche dupliquée
      isGlobal: false,    // Ce n'est plus une tâche globale
    }));

    // Insérer ces tâches dans la collection `usermadetasks`
    await UserMadeTask.insertMany(userMadeTasks);

  } catch (err) {
    console.error("Erreur lors de la duplication des tâches : ", err);
    throw new Error("Erreur lors de la création des tâches pour l'utilisateur");
  }
};
