const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const http = require("http");
const cors = require("cors");
const path = require("path");
const compression = require("compression");

const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const characterRoutes = require("./routes/characterRoutes");
const tableTopRoutes = require("./routes/tabletopRoutes");
const npcRoutes = require("./routes/npcRoutes");
const gmFilesRoutes = require("./routes/gmFilesRoutes");

dotenv.config();
console.log("🔑 JWT_SECRET:", process.env.JWT_SECRET);
const app = express();
app.use(compression());
const server = http.createServer(app);


// Middleware pour CORS global
const allowedOrigins = new Set([
  (process.env.FRONT_URL || "").replace(/\/$/, ""),
  "http://localhost:5173"
]);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
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

io.on("connection", (socket) => {
  console.log("🟢 Un utilisateur s'est connecté via WebSocket");
  socket.onAny((event, ...args) => {
    console.log(`📡 [SERVER] Reçu un événement : ${event}`, args);
  });
  socket.on("joinTable", (tableId) => {
    socket.join(`table-${tableId}`);
    console.log(`👤 [SERVER] Un utilisateur a rejoint la table ${tableId}`);
  });
  socket.on("newMessage", (message) => {
    console.log("📩 Message reçu et diffusé :", message);
    io.to(`table-${message.tableId}`).emit("newMessage", message);
  });
  socket.on("sendMedia", ({ tableId, mediaUrl }) => {
    console.log(`📥 [SERVER] Reçu sendMedia pour la table ${tableId}`);
    io.to(`table-${tableId}`).emit("newMedia", mediaUrl);
  });
  socket.on("sendText", ({ tableId, textContent }) => {
    console.log(`📥 [SERVER] Reçu sendText pour la table ${tableId}`);
    io.to(`table-${tableId}`).emit("newText", { textContent });
  });
  socket.on("removeMedia", ({ tableId }) => {
    console.log(`🗑️ Suppression du média affiché pour la table ${tableId}`);
    io.to(`table-${tableId}`).emit("removeMedia");
  });
  socket.on("updateHealth", ({ characterId, pointsOfLife, tableId, characterName }) => {
    console.log("⚡ Mise à jour PV reçue :", characterId, pointsOfLife);
    io.to(`table-${tableId}`).emit("updateHealth", { characterId, pointsOfLife });
    const systemMessage = {
      message: `${characterName} change ses points de vie en : ${pointsOfLife}`,
      characterName: "Système",
      senderName: "Système",
      tableId: tableId,
    };
    io.to(`table-${tableId}`).emit("newMessage", systemMessage);
  });
  socket.on("disconnect", () => {
    console.log("🔴 Un utilisateur s'est déconnecté");
  });
});

app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/gmAssets", express.static(path.join(__dirname, "gmAssets")));

// Routes
app.use("/api/users", userRoutes);
app.use("/api/characters", characterRoutes);
app.use("/api/tabletop", tableTopRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api", npcRoutes);
app.use("/api/gmfiles", gmFilesRoutes);

const PORT = process.env.PORT || 8080;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 CORS configuré pour : ${Array.from(allowedOrigins).join(", ")}`);
});
