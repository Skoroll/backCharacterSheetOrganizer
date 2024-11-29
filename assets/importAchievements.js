const mongoose = require('mongoose');
const User = require('../models/userModel'); // Charger le modèle utilisateur
const Achievement = require('../models/achievementsModel');  // Charger le modèle Achievement
require('dotenv').config({path: '../.env'});

// Importer les fichiers JSON
const Achievements = require('./AchievementList/AchievementList.json');


//node importAchievements.js pour envoyer les succès sur la DB




// Fonction de connexion MongoDB
const connectDB = async () => {
    try {
      await mongoose.connect(process.env.MONGO_ADMIN, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('MongoDB connected');
    } catch (err) {
      console.error('Error connecting to MongoDB:', err);
      process.exit(1);
    }
  };
  
  // Fonction pour récupérer ou créer un utilisateur admin

const getOrCreateAdminUser = async () => {
    try {
        console.log("Admin user not found. Creating new admin user...");
        
        // Vérifie si l'utilisateur existe déjà
        let adminUser = await User.findOne({ email: "admin@example.com" });
        if (adminUser) {
            console.log("Admin user already exists.");
            return adminUser;
        }

        // Crée un nouvel utilisateur si aucun n'est trouvé
        const hashedPassword = await bcrypt.hash("adminPassword", 10);
        const newAdmin = new User({
            name: "Admin",
            email: "admin@example.com",
            password: hashedPassword,
        });

        adminUser = await newAdmin.save();
        console.log("Admin user created");
        return adminUser;
    } catch (error) {
        console.error("Error fetching/creating admin user:", error);
        throw error;
    }
};

  
  
  // Fonction d'importation des données
  const importData = async () => {
    const adminUser = await getOrCreateAdminUser(); // Récupérer l'ID de l'administrateur
  
    try {
      // Ajoutez l'ID utilisateur aux achievements
      const allAchievements = Achievements.map(achievement => ({
        ...achievement,
        user: adminUser._id, // Assurez-vous que le modèle prévoit une clé "user" si nécessaire
      }));
  
      // Insérez les achievements dans la base de données avec le modèle Achievement
      await Achievement.insertMany(allAchievements);
  
      console.log('Data imported!');
      process.exit();
    } catch (err) {
      console.error('Error importing data:', err);
      process.exit(1);
    }
  };
  

// Connexion à MongoDB et lancement de l'importation
connectDB().then(importData);