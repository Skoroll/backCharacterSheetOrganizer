const mongoose = require('mongoose');
const User = require('../models/userModel'); // Charger le modèle utilisateur
const Task = require('../models/taskModel');  // Charger le modèle Task
require('dotenv').config({path: '../.env'});

// Importer les fichiers JSON
const Kitchen = require('./TaskLists/Kitchen.json');
const LivingRoom = require('./TaskLists/LivingRoom.json');
const BathRoom = require("./TaskLists/BathRoom.json");
const BedRoom = require('./TaskLists/BedRoom.json');
const Cellar = require('./TaskLists/Cellar.json');
const Clearance = require('./TaskLists/Clearance.json');
const DiningRoom = require('./TaskLists/DiningRoom.json');
const Entrance = require('./TaskLists/Entrance.json');
const Office = require('./TaskLists/Office.json');
const Toilets = require('./TaskLists/Toilets.json');



//node importTasks.js pour envoyer les tâches sur la DB




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
      try {
          const allTasks = [
              ...Kitchen.map(task => ({ ...task, room: 'Cuisine' })),
              ...LivingRoom.map(task => ({ ...task, room: 'Salon' })),
              ...BathRoom.map(task => ({ ...task, room: 'Salle de bain' })),
              ...BedRoom.map(task => ({ ...task, room: 'Chambre' })),
              ...Cellar.map(task => ({ ...task, room: 'Cellier' })),
              ...Clearance.map(task => ({ ...task, room: 'Débarras' })),
              ...DiningRoom.map(task => ({ ...task, room: 'Salle à manger' })),
              ...Entrance.map(task => ({ ...task, room: 'Entrée' })),
              ...Office.map(task => ({ ...task, room: 'Bureau' })),
              ...Toilets.map(task => ({ ...task, room: 'Toilettes' })),
          ];
  
          await Task.insertMany(allTasks);
          console.log('Tâches globales importées');
          process.exit();
      } catch (err) {
          console.error("Erreur lors de l'importation des tâches globales:", err);
          process.exit(1);
      }
  };
  

// Connexion à MongoDB et lancement de l'importation
connectDB().then(importData);