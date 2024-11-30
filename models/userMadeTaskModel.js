const mongoose = require('mongoose');

const userMadeTaskSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  time: { type: String, required: true },
  frequency: { type: String, required: true },
  what: [String],
  isDone: { type: Boolean, default: false },
  dateDone: { type: Date },
  room: { type: String, required: true },
  isGlobal: { type: Boolean, default: false },  // Indique si la tâche est publique
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }  // Relier la tâche à l'utilisateur qui l'a créée
}, {
  timestamps: true,
});

module.exports = mongoose.model('UserMadeTask', userMadeTaskSchema);
