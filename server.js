//server.js
const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const userRoutes = require('./routes/userRoutes');
const cors = require('cors');
const path = require('path');

// Chargement des variables d'environnement
dotenv.config();

const app = express();  // Définir l'instance de l'application ici

// Middleware pour servir les fichiers statiques
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connexion à MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Configuration de CORS
app.use(cors({ origin: 'http://localhost:3000' })); // Autorise uniquement le frontend

// Middlewares globaux
app.use(express.json());

// Routes
app.use('/api/users', userRoutes);

// Gestion des erreurs
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

app.use((err, req, res, next) => {
  console.error('Erreur survenue:', err);
  res.status(err.status || 500).json({ message: err.message || 'Erreur interne du serveur' });
});


// Démarrage du serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
