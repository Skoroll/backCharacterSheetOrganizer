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
      type: [String], // Tableau de chaînes de caractères
      default: [],
    },
    /*equipments: {
      type: [String],
      default: [],
    },*/
  },
  {
    timestamps: true, // Ajoute createdAt et updatedAt
  }
);

const User = mongoose.model('User', userSchema);
module.exports = User;
