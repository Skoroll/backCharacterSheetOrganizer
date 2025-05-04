const mongoose = require("mongoose");

const todoSchema = new mongoose.Schema({
  category: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  isDone: { type: Boolean, default: false },
  dateDone: { type: String, default: "" },
}, {
  timestamps: true // Pour savoir quand c'est créé ou modifié
});

const Todo = mongoose.model("Todo", todoSchema);

module.exports = Todo;
