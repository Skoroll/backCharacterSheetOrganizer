const express = require("express");
const dotenv = require("dotenv");
const cloudinary = require("cloudinary").v2;
const mongoose = require("mongoose");
const http = require("http");
const cors = require("cors");
const path = require("path");
const compression = require("compression");
const todoRoutes = require("./routes/toDoRoutes");
const articleRoutes = require("./routes/articleRoutes");
const stripeRoutes = require("./routes/stripeRoutes");

const itemRoutes = require("./routes/itemRoutes")
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const characterRoutes = require("./routes/characterRoutes");
const tableTopRoutes = require("./routes/tabletopRoutes");
const npcRoutes = require("./routes/npcRoutes");
const gmFilesRoutes = require("./routes/gmFilesRoutes");

dotenv.config();
const app = express();
app.use(compression());
const server = http.createServer(app);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

cloudinary.api.ping((error, result) => {
  if (error) {
    console.error("❌ Erreur de connexion à Cloudinary :", error);
  } else {
    console.log("✅ Connexion Cloudinary réussie :", result);
  }
});


// Middleware pour CORS global
const allowedOrigins = new Set([
  (process.env.FRONT_URL || "").replace(/\/$/, ""),
  "http://localhost:5173"
]);

app.use(express.json());

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-admin");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});

// Connexion à MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

const io = require("socket.io")(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use("/gmAssets", express.static("gmAssets"));


app.set("io", io);

app.use(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" })
);

// Routes
app.use("/api/items", itemRoutes);
app.use("/api/users", userRoutes);
app.use("/api/characters", characterRoutes);
app.use("/api/tabletop", tableTopRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api", npcRoutes);
app.use("/api/gmfiles", gmFilesRoutes);
app.use("/api/todos", todoRoutes);
app.use("/api/articles", articleRoutes);
app.use("/api/stripe", stripeRoutes); 

io.on("connection", (socket) => {
  console.log("✅ Nouveau client connecté :", socket.id);

  // Historique des logs
  socket.on("requestLogsHistory", () => {
    socket.emit("logsHistory", logs);
  });

  socket.on("tableStyleUpdated", ({ tableId }) => {
    io.to(`table-${tableId}`).emit("refreshTableStyle");
  });

  socket.on("joinTable", (tableId) => {
    socket.join(`table-${tableId}`);
  });

  socket.on("newMessage", (message) => {
    io.to(`table-${message.tableId}`).emit("newMessage", message);
  });

  socket.on("chatMessage", (message) => {
    const systemMessage = {
      senderName: "Système",
      characterName: "Système",
      message: message.content,
      tableId: message.tableId,
      isSystem: true,
    };
    io.to(`table-${message.tableId}`).emit("newMessage", systemMessage);
  });

  socket.on("sendMedia", ({ tableId, mediaUrl }) => {
    io.to(`table-${tableId}`).emit("newMedia", mediaUrl);
  });

  socket.on("sendText", ({ tableId, textContent, textFont, textColor, isBG }) => {
    io.to(`table-${tableId}`).emit("newText", { textContent, textFont, textColor, isBG });
  });

  socket.on("removeMedia", ({ tableId }) => {
    io.to(`table-${tableId}`).emit("removeMedia");
  });

  socket.on("updateHealth", ({ characterId, pointsOfLife, tableId, characterName }) => {
    io.to(`table-${tableId}`).emit("updateHealth", { characterId, pointsOfLife });
    const systemMessage = {
      message: `${characterName} change ses points de vie en : ${pointsOfLife}`,
      characterName: "Système",
      senderName: "Système",
      tableId: tableId,
    };
    io.to(`table-${tableId}`).emit("newMessage", systemMessage);
  });

  socket.on("sendNpcToDisplay", (npc) => {
    io.to(`table-${npc.tableId}`).emit("sendNpcToDisplay", npc); 
  });

  socket.on("disconnect", () => {
    console.log("❌ Client déconnecté :", socket.id);
  });
});


// Simuler un utilisateur connecté pour sécuriser (à adapter avec ton système)
const isAdmin = (req, res, next) => {
  const isAdminHeader = req.headers["x-admin"] === "true"; // Exemple simplifié
  if (!isAdminHeader) return res.status(403).json({ message: "Accès refusé." });
  next();
};

// Route REST pour envoyer l'historique des logs (optionnel)
const logs = [];

app.get("/api/admin/logs", isAdmin, (req, res) => {
  res.json({ logs });
});

// Fonction custom pour log + envoyer via websocket + stocker
function log(message) {
  const logMsg = `${new Date().toLocaleString()} - ${message}`;
  logs.push(logMsg);
  if (logs.length > 500) logs.shift(); // limite mémoire
  console.log(logMsg);
  io.emit("log", logMsg);
}

// Exemple d'utilisation (tu peux remplacer tous tes console.log par log(...))
log("Serveur démarré...");

// Exemple route qui log
app.get("/test-log", (req, res) => {
  log("Une requête test a été effectuée.");
  res.send("Log envoyé.");
});




const PORT = process.env.PORT || 8080;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 CORS configuré pour : ${Array.from(allowedOrigins).join(", ")}`);
});
