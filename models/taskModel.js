const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  name: { type: String, required: true },
  room: { type: String, required: true },
  description: String,
  time: String,
  frequency: String,
  what: [String],
  isDone: { type: Boolean, default: false },
  dateDone: Date, // Ajout de ce champ
  lastCompleted: Date, // Champ existant
  nextDue: Date,
  isGlobal: { type: Boolean, default: false },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
});

module.exports = mongoose.model('Task', taskSchema);
