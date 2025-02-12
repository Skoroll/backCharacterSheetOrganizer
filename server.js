const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const http = require("http"); // Ajout du module HTTP
const cors = require("cors");
const path = require("path");

const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chat");
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
    origin: "*", // À remplacer par l'URL du frontend en production
  },
});

io.on("connection", (socket) => {
  console.log("Nouvel utilisateur connecté");

  socket.on("playerRemoved", ({ playerId }) => {
    io.emit("updatePlayers", { playerId });
  });

  socket.on("disconnect", () => {
    console.log("Utilisateur déconnecté");
  });
});

// Configuration de CORS
app.use(
  cors({
    origin: "http://localhost:5173",
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
app.use("/api/chat", chatRoutes); 
// Démarrage du serveur sur le bon port
const PORT = process.env.PORT || 8080;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
