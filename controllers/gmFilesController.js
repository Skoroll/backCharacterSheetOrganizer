const GmFile = require("../models/GmFilesModel");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configuration du stockage pour les images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// 📌 Upload d'un fichier texte ou image
exports.uploadFile = async (req, res) => {
    try {
      console.log("📥 Fichier reçu :", req.files);
      console.log("📥 Table ID reçu :", req.body.tableId);
  
      const { tableId } = req.body;
      if (!tableId) return res.status(400).json({ message: "ID de table requis." });
  
      const savedFiles = [];
  
      if (req.body.text) {
        const newTextFile = new GmFile({
          tableId,
          type: "text",
          filename: `text-${Date.now()}`,
          content: req.body.text,
        });
        await newTextFile.save();
        savedFiles.push(newTextFile);
      }
  
      if (req.files) {
        const uploadedFiles = req.files.map((file) => ({
          tableId,
          type: "image",
          filename: file.filename,
          path: `/gmAssets/${file.filename}`,
        }));
  
        const savedImages = await GmFile.insertMany(uploadedFiles);
        savedFiles.push(...savedImages);
      }
  
      res.json({ message: "Fichiers sauvegardés", files: savedFiles });
    } catch (error) {
      console.error("❌ Erreur lors de l'upload :", error);
      res.status(500).json({ message: "Erreur lors de l'upload", error });
    }
  };
  
  
  
// 📌 Récupérer tous les fichiers d'une table spécifique
exports.getAllFiles = async (req, res) => {
    try {
      const { tableId } = req.query;
      
      if (!tableId) {
        return res.status(400).json({ message: "ID de table requis." });
      }

      const files = await GmFile.find({ tableId }); // ✅ Ne récupère que les fichiers de cette table
      res.json(files);
    } catch (error) {
      res.status(500).json({ message: "Erreur de récupération des fichiers", error });
    }
};

// 📌 Supprimer un fichier
exports.deleteFile = async (req, res) => {
  try {
    const file = await GmFile.findById(req.params.id);
    if (!file) return res.status(404).json({ message: "Fichier non trouvé" });

    // Supprimer physiquement le fichier si c'est une image
    if (file.type === "image" && file.path) {
      const filePath = path.join(__dirname, "..", file.path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`🗑️ Fichier supprimé: ${filePath}`);
      } else {
        console.warn("⚠️ Fichier introuvable sur le serveur :", filePath);
      }
    }

    await GmFile.findByIdAndDelete(req.params.id);
    res.json({ message: "Fichier supprimé avec succès" });
  } catch (error) {
    console.error("❌ Erreur lors de la suppression :", error);
    res.status(500).json({ message: "Erreur lors de la suppression", error });
  }
};

