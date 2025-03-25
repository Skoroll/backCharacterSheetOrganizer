const GmFile = require("../models/GmFilesModel");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const cloudinary = require("cloudinary").v2;

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

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "gmAssets",
          format: "webp",
        });

        const newImage = new GmFile({
          tableId,
          type: "image",
          filename: file.originalname,
          path: result.secure_url,
        });

        await newImage.save();
        savedFiles.push(newImage);

        // Nettoyage fichier temporaire local
        const fs = require("fs");
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      }
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
    if (file.path?.startsWith("https://res.cloudinary.com")) {
      const parts = file.path.split("/");
      const filenameWithExt = parts[parts.length - 1];
      const publicId = "gmAssets/" + filenameWithExt.split(".")[0]; // ex: gmAssets/monfichier-12345
    
      try {
        await cloudinary.uploader.destroy(publicId);
        console.log("🗑️ Image supprimée de Cloudinary :", publicId);
      } catch (cloudErr) {
        console.warn("⚠️ Erreur suppression Cloudinary :", cloudErr.message);
      }
    }

    await GmFile.findByIdAndDelete(req.params.id);
    res.json({ message: "Fichier supprimé avec succès" });
  } catch (error) {
    console.error("❌ Erreur lors de la suppression :", error);
    res.status(500).json({ message: "Erreur lors de la suppression", error });
  }
};

