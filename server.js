//server.js
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
app.use(cors({
  origin: ['http://localhost:3000', 'https://skoroll.github.io'], // Ajouter les origines autorisées
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Méthodes HTTP autorisées
  credentials: true, // Permet d'envoyer des cookies ou des en-têtes d'authentification
}));


// Middlewares globaux
app.use(express.json());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/achievements', achievementsRoutes);

// Fonction pour calculer la prochaine date d'exécution selon la fréquence
const calculateNextDueDate = (frequency) => {
  const now = new Date();
  switch (frequency) {
    case 'daily':
      return new Date(now.setDate(now.getDate() + 1));  // Exemple pour une tâche quotidienne
    case 'weekly':
      return new Date(now.setDate(now.getDate() + 7));  // Exemple pour une tâche hebdomadaire
    case 'monthly':
      return new Date(now.setMonth(now.getMonth() + 1));  // Exemple pour une tâche mensuelle
    default:
      return now;
  }
};

// Vérifier les tâches à valider toutes les heures
cron.schedule('0 * * * *', async () => {
  try {
    const tasksDue = await Task.find({ nextDue: { $lte: new Date() } });
    if (tasksDue.length === 0) {
      console.log('Aucune tâche due à valider');
    }
    tasksDue.forEach(async (task) => {
      try {
        task.lastCompleted = new Date();
        task.nextDue = calculateNextDueDate(task.frequency);
        await task.save();
        console.log(`Tâche ${task._id} mise à jour`);
      } catch (error) {
        console.error(`Erreur lors de la mise à jour de la tâche ${task._id}:`, error);
      }
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
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});




