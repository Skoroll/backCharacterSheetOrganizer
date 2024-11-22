// models/userModel.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    profileImage: {
      type: String,
      default: '',
    },
    rooms: {
      type: [String],  // Tableau de chaînes de caractères
      default: [],     // Par défaut, aucune pièce n'est sélectionnée
    },
    equipments: {
      type: [String],  // Tableau de chaînes pour les équipements sélectionnés
      default: [],
    },
  },
  {
    timestamps: true, // Ajoute createdAt et updatedAt
  }
);


// Méthode pour comparer les mots de passe
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Middleware pour hasher le mot de passe avant de sauvegarder
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    console.log('Le mot de passe n\'a pas été modifié, passage au suivant.');
    return next();
  }

  console.log('Hashage du mot de passe...');
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  console.log('Mot de passe hashé avec succès.');
  next();
});


const User = mongoose.model('User', userSchema);

module.exports = User;
