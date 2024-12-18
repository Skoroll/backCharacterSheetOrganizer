const mongoose = require('mongoose');

const userMadeTaskSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  time: { type: String, required: true },
  frequency: { type: String, required: true },
  what: [String],
  isDone: { type: Boolean, default: false },
  dateDone: Date, 
  lastCompleted: Date, 
  nextDue: Date,
  resetTimer: { type: Date }, // Nouvelle propriété pour la réinitialisation
  room: { type: String, required: true },
  isGlobal: { type: Boolean, default: false },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
});

module.exports = mongoose.model('UserMadeTask', userMadeTaskSchema);


module.exports = mongoose.model('UserMadeTask', userMadeTaskSchema);
