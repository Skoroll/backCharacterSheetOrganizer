const mongoose = require('mongoose');

const questSchema = mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true }, // Combat, Exploration, etc.
  details: { type: String },
  rewards: { type: String },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  game: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const Quest = mongoose.model('Quest', questSchema);
module.exports = Quest;
