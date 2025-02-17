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
const npcRoutes = require("./routes/npcRoutes");

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
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Initialisation de Socket.io avec le serveur HTTP
const io = require("socket.io")(server, {
  cors: {
    origin: "http://localhost:5173", // Modifier pour ton domaine en production
  },
});

// ✅ Définir l'instance de io globalement pour l'utiliser dans les contrôleurs
app.set("io", io);

io.on("connection", (socket) => {
  

  // L'utilisateur rejoint une salle correspondant à la table
  socket.on("joinTable", (tableId) => {
    socket.join(`table-${tableId}`);
  });

  // Diffusion des messages de chat
  socket.on("newMessage", (message) => {
    console.log("📩 Message reçu et diffusé :", message);
    io.to(`table-${message.tableId}`).emit("newMessage", message);
  });

  // Mise à jour des PV avec message dans le chat
  socket.on("updateHealth", ({ characterId, pointsOfLife, tableId, characterName }) => {
    console.log("⚡ Mise à jour PV reçue :", characterId, pointsOfLife);
    io.to(`table-${tableId}`).emit("updateHealth", { characterId, pointsOfLife });

    // 🚀 Envoyer un message au chat
    const systemMessage = {
      message: `${characterName} change ses points de vie en : ${pointsOfLife}`,
      characterName: "Système",
      senderName: "Système",
      tableId: tableId,
    };
    console.log("💬 Envoi message au chat :", systemMessage);
    io.to(`table-${tableId}`).emit("newMessage", systemMessage);
  });

  // Gestion de la déconnexion
  socket.on("disconnect", () => {
  });
});


// Configuration de CORS
app.use(
  cors({
    origin: "http://localhost:5173", // À remplacer par ton URL frontend en production
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  })
);

app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/users", userRoutes);
app.use("/api/characters", characterRoutes);
app.use("/api/tabletop", tableTopRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api", npcRoutes);

// Démarrage du serveur
const PORT = process.env.PORT || 8080;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
