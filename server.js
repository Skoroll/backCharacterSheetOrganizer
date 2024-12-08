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

// Chargement des variables d'environnement
dotenv.config();

const app = express();

// Middleware pour servir les fichiers statiques
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configuration CORS
app.use(cors({
  origin: ['http://localhost:3000', 'https://skoroll.github.io'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

app.set('trust proxy', 1); // Nécessaire pour Fly.io

// Connexion à MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Middlewares globaux
app.use(express.json());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/achievements', achievementsRoutes);

// Vérification des tâches à valider toutes les heures
cron.schedule('0 * * * *', async () => {
  try {
    const tasksDue = await Task.find({ nextDue: { $lte: new Date() } });
    tasksDue.forEach(async (task) => {
      task.lastCompleted = new Date();
      task.nextDue = calculateNextDueDate(task.frequency);
      await task.save();
      console.log(`Tâche ${task._id} mise à jour`);
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des tâches dues:', error);
  }
});

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error('Erreur survenue:', err);
  res.status(err.status || 500).json({ message: err.message || 'Erreur interne du serveur' });
});

// Démarrage du serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
