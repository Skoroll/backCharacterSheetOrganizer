const Task = require('../models/taskModel');
const UserMadeTask = require('../models/userMadeTaskModel');

// Crée les tâches pour un utilisateur spécifique
exports.createUserTasks = async (userId) => {
  const globalTasks = await Task.find({ isGlobal: true });

  const userMadeTasks = globalTasks.map((task) => ({
    ...task.toObject(),
    user: userId,
    isGlobal: false,
  }));

  await UserMadeTask.insertMany(userMadeTasks);
  console.log('Tâches personnalisées créées avec succès');
};
