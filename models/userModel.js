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
    tablesJoined: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Table' }] // Stocke les tables rejointes
  }
);

const User = mongoose.model('User', userSchema);
module.exports = User;
