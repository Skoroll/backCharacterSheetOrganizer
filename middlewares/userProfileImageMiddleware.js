const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Définition du dossier de stockage des images de profil
const uploadDir = path.join(__dirname, "..", "uploads", "profileImages");

// Vérifier et créer le dossier s'il n'existe pas
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuration de Multer pour le stockage des images de profil
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}${ext}`);
  },
});

// Filtrage des fichiers pour n'accepter que les images
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Format de fichier non autorisé. Formats acceptés : JPG, PNG, GIF, WEBP."));
  }
};

// Middleware Multer
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limite de 5 Mo
});

module.exports = upload;
