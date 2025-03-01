const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const http = require("http");
const cors = require("cors");
const path = require("path");

const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const characterRoutes = require("./routes/characterRoutes");
const tableTopRoutes = require("./routes/tabletopRoutes");
const npcRoutes = require("./routes/npcRoutes");
const gmFilesRoutes = require("./routes/gmFilesRoutes");

dotenv.config();
console.log("🔑 JWT_SECRET:", process.env.JWT_SECRET);
const app = express();
const server = http.createServer(app);

// Middleware pour CORS global
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", process.env.FRONT_URL || "http://localhost:5173");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");
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
    origin: [process.env.FRONT_URL, "http://localhost:5173"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.set("io", io);

io.on("connection", (socket) => {
  console.log("🟢 Un utilisateur s'est connecté via WebSocket");
  socket.onAny((event, ...args) => {
    console.log(`📡 [SERVER] Reçu un événement : ${event}`, args);
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
});
