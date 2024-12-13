const Task = require('../models/taskModel');
const UserMadeTask = require('../models/userMadeTaskModel');

exports.createUserTasks = async (userId) => {
  const globalTasks = await Task.find({ isGlobal: true });

  const userTasks = globalTasks.map((task) => {
    const { _id, ...taskWithoutId } = task.toObject(); // Retirer l'_id existant
    return {
      ...taskWithoutId,
      user: userId,
      isGlobal: false,
    };
  });

  await UserMadeTask.insertMany(userTasks);
};
