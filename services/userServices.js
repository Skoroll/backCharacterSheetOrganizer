// userService.js

const Task = require('../models/taskModel'); // Modèle des tâches globales
const UserMadeTask = require('../models/userMadeTaskModel'); // Modèle des tâches utilisateur

// Fonction pour dupliquer les tâches pour un utilisateur
exports.createUserTasks = async (userId) => {
  try {
    // Récupérer toutes les tâches globales
    const tasks = await Task.find({});

    // Créer des copies de ces tâches pour l'utilisateur avec un nouvel ID
    const userMadeTasks = tasks.map(task => {
      return {
        ...task.toObject(),  // Copie de la tâche sans l'ID original
        userId: userId, // Ajouter l'ID de l'utilisateur
        _id: new mongoose.Types.ObjectId(), // Générer un nouvel ID unique pour la tâche
      };
    });

    // Insérer ces tâches dans la collection `usermadetasks`
    await UserMadeTask.insertMany(userMadeTasks);

  } catch (err) {
    console.error("Erreur lors de la duplication des tâches : ", err);
    throw new Error("Erreur lors de la création des tâches pour l'utilisateur");
  }
};
