const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema({
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


  // Ajout pour le paywall Ko-fi
  isPremium: { type: Boolean, default: false }, // True si l'utilisateur a un abonnement Ko-fi valide
  premiumUntil: { type: Date, default: null }, // Date limite si abonnement temporaire
  kofiTier: { type: String, default: null } // Nom du Tier Ko-fi
});

const User = mongoose.model('User', userSchema);
module.exports = User;
