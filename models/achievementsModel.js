const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  icon: { type: String, required: true },
  name: { type: String, required: true },
  content: { type: String, required: true },
  isGlobal: { type: Boolean, default: false },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Lier à l'utilisateur
}, {
  timestamps: true,
});

module.exports = mongoose.model('Achievement', achievementSchema);
