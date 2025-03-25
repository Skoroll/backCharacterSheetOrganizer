const GmFile = require("../models/GmFilesModel");
const cloudinary = require("../utils/cloudinary");
const streamifier = require("streamifier");

// 🔁 Fonction pour envoyer un buffer à Cloudinary
const uploadToCloudinary = (buffer, filename) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "gmAssets",
        public_id: filename.split(".")[0],
        format: "webp",
        transformation: [
          { width: 1280, crop: "limit" },
          { quality: "auto" },
        ],
      },
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );

    streamifier.createReadStream(buffer).pipe(stream);
  });
};

// 📌 Upload d'un fichier texte ou image
exports.uploadFile = async (req, res) => {
  try {
    const { tableId, title } = req.body;
    if (!tableId) {
      return res.status(400).json({ message: "ID de table requis." });
    }

    const savedFiles = [];

    // ✅ Texte
    if (req.body.text) {
      const newTextFile = new GmFile({
        tableId,
        type: "text",
        filename: title || `text-${Date.now()}`,
        content: req.body.text,
      });

      await newTextFile.save();
      savedFiles.push(newTextFile);
    }

    // ✅ Upload d'image via Cloudinary depuis buffer
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map(async (file) => {
        const result = await uploadToCloudinary(file.buffer, file.originalname);

        const newImage = new GmFile({
          tableId,
          type: "image",
          filename: file.originalname,
          path: result.secure_url,
        });

        await newImage.save();
        return newImage;
      });

      const uploadedImages = await Promise.all(uploadPromises);
      savedFiles.push(...uploadedImages);
    }

    console.log("✅ Upload terminé. Total fichiers enregistrés :", savedFiles.length);
    return res.json({ message: "Fichiers sauvegardés", files: savedFiles });
  } catch (error) {
    console.error("❌ Erreur lors de l'upload :", error);
    return res.status(500).json({ message: "Erreur lors de l'upload", error });
  }
};

// 📌 Récupérer tous les fichiers d'une table spécifique
exports.getAllFiles = async (req, res) => {
  try {
    const { tableId } = req.query;

    if (!tableId) {
      return res.status(400).json({ message: "ID de table requis." });
    }

    const files = await GmFile.find({ tableId });
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

    if (file.path?.startsWith("https://res.cloudinary.com")) {
      const parts = file.path.split("/");
      const filenameWithExt = parts[parts.length - 1];
      const publicId = "gmAssets/" + filenameWithExt.split(".")[0];

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
