const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const http = require("http"); // Importation du module HTTP
const cors = require("cors");
const path = require("path");

const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const characterRoutes = require("./routes/characterRoutes");
const tableTopRoutes = require("./routes/tabletopRoutes");

// Chargement des variables d'environnement
dotenv.config();

const app = express();
const server = http.createServer(app); // Création du serveur HTTP

// Connexion à MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Initialisation de Socket.io avec le serveur HTTP
const io = require("socket.io")(server, {
  cors: {
    origin: "*", // Autoriser tous les domaines (en production, tu devrais spécifier ton domaine frontend ici)
  },
});

io.on("connection", (socket) => {
  console.log("Un utilisateur est connecté");

  // L'utilisateur rejoint une salle correspondant à la table
  socket.on("joinTable", (tableId) => {
    socket.join(tableId); // L'utilisateur rejoint la salle correspondant à tableId
    console.log(`Utilisateur rejoint la table ${tableId}`);
  });

  // Lorsqu'un message est envoyé, on le diffuse à tous les utilisateurs dans la même salle (table)
  socket.on("newMessage", (message) => {
    io.to(message.tableId).emit("newMessage", message); // Diffuse le message à tous les utilisateurs de la même table
  });

  // Écouter l'événement de déconnexion
  socket.on("disconnect", () => {
    console.log("Utilisateur déconnecté");
  });
});

// Configuration de CORS
app.use(
  cors({
    origin: "http://localhost:5173", // Remplacer par l'URL de ton frontend en production
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// Middleware global
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/users", userRoutes);
app.use("/api/characters", characterRoutes);
app.use("/api/tabletop", tableTopRoutes);
app.use("/api/chat", chatRoutes);

// Démarrage du serveur
const PORT = process.env.PORT || 8080;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
