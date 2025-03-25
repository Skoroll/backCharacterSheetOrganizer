const multer = require("multer");

// Utilise la mémoire : évite l'écriture disque (parfait pour Render)
const storage = multer.memoryStorage();

// Middleware prêt à être utilisé dans les routes
const uploadGmFile = multer({ storage });

module.exports = { uploadGmFile };
