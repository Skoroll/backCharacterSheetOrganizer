const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const userRoutes = require('./routes/userRoutes');
const taskRoutes = require('./routes/taskRoutes');
const achievementsRoutes = require('./routes/achievementsRoutes');
const cron = require('node-cron');
const Task = require('./models/taskModel');
const cors = require('cors');
const path = require('path');
const uploadMiddleware = require('./middlewares/uploadMiddleware'); // Importer le middleware

// Chargement des variables d'environnement
dotenv.config();

const app = express();

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

  //
// Configuration de CORS
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://skoroll.github.io',
    'https://cleanback.fly.dev', // Ajout de l'origine Fly.io
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

// Middlewares globaux
app.use(express.json());

// Ajouter la route pour l'upload
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// Routes
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/achievements', achievementsRoutes);

// Démarrage du serveur
const PORT = 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
