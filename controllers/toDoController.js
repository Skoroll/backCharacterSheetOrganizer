const Todo = require("../models/todoModel");

// Récupérer toutes les tâches
exports.getTodos = async (req, res) => {
  try {
    const todos = await Todo.find().sort({ createdAt: -1 });
    res.json(todos);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Erreur lors de la récupération des tâches." });
  }
};

// Créer une nouvelle tâche
exports.createTodo = async (req, res) => {
  const { category, title, description } = req.body;

  if (!category || !title || !description) {
    return res.status(400).json({ message: "Tous les champs sont requis." });
  }

  try {
    const newTodo = new Todo({
      category,
      title,
      description,
    });

    await newTodo.save();
    res.status(201).json(newTodo);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Erreur lors de la création de la tâche." });
  }
};

// Modifier une tâche
exports.updateTodo = async (req, res) => {
  const { id } = req.params;

  try {
    const todo = await Todo.findById(id);
    if (!todo) {
      return res.status(404).json({ message: "Tâche non trouvée" });
    }

    // Appliquer les modifications envoyées
    if (req.body.isDone !== undefined) {
      todo.isDone = req.body.isDone;
      if (req.body.isDone) {
        todo.dateDone = req.body.dateDone || new Date().toISOString();
      } else {
        todo.dateDone = null;
      }
    }

    if (req.body.title) todo.title = req.body.title;
    if (req.body.description) todo.description = req.body.description;
    if (req.body.category) todo.category = req.body.category;

    await todo.save();

    res.status(200).json(todo);
  } catch (err) {
    console.error("Erreur updateTodo :", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// Supprimer une tâche
exports.deleteTodo = async (req, res) => {
  const { id } = req.params;

  try {
    await Todo.findByIdAndDelete(id);
    res.status(200).json({ message: "Tâche supprimée." });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Erreur lors de la suppression de la tâche." });
  }
};
