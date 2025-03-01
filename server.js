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
const allowedOrigins = [
  (process.env.FRONT_URL || "").replace(/\/$/, ""),
  "http://localhost:5173"
];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
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
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
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
  console.log(`🌍 CORS configuré pour : ${allowedOrigins.join(", ")}`);
});
