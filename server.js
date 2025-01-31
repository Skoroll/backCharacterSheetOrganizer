const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const userRoutes = require('./routes/userRoutes');
const characterRoutes = require('./routes/characterRoutes');
const cors = require('cors');
const path = require('path');

// Chargement des variables d'environnement
dotenv.config();

const app = express();

// Connexion à MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Configuration de CORS
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

// Middleware global
app.use(express.json());

// Routes d'authentification
app.use('/api/users', userRoutes);
app.use("/api/characters", characterRoutes);
// Démarrage du serveur
const PORT = 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
