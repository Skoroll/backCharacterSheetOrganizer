const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  tablesJoined: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Table' }],
  refreshToken: { type: String },
  isAdmin: { type: Boolean, required: false, default: false },
  selectedCharacter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Character",
    default: null,
  },
  friendList: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  userQuest: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Quest' }],
  addedQuest: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Quest' }],
  isPremium: { type: Boolean, default: false },
  premiumUntil: { type: Date, default: null },
  kofiTier: { type: String, default: null }
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);
module.exports = User;
