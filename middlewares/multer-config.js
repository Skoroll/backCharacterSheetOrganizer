const multer = require("multer");
const path = require("path");
const sharp = require("sharp"); // ✅ Pour la conversion en WebP
const fs = require("fs");

const tempDir = path.join(__dirname, "../tempUploads"); // 📂 Dossier temporaire
const gmAssetsDir = path.join(__dirname, "../gmAssets"); // 📂 Dossier final

// 🔹 Vérifier si les dossiers existent, sinon, les créer
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
if (!fs.existsSync(gmAssetsDir)) fs.mkdirSync(gmAssetsDir, { recursive: true });

// 📁 Multer : Stocker temporairement dans `tempUploads/`
const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, tempDir); // ✅ Enregistre d'abord dans `tempUploads/`
  },
  filename: (req, file, callback) => {
    const name = file.originalname.split(" ").join("_").split(".")[0];
    callback(null, name + "_" + Date.now() + path.extname(file.originalname)); // Garde l'extension d'origine
  },
});

// ✅ Middleware multer
const uploadGmFile = multer({ storage });

// ✅ Middleware pour convertir en WebP et déplacer vers `gmAssets/`
const convertToWebp = async (req, res, next) => {
  if (!req.files || req.files.length === 0) return next();

  try {
    await Promise.all(
      req.files.map(async (file) => {
        const inputPath = path.join(tempDir, file.filename); // 📥 Fichier temporaire
        const outputFilename = file.filename.replace(/\.\w+$/, ".webp"); // 📄 Converti en .webp
        const outputPath = path.join(gmAssetsDir, outputFilename); // 📂 Destination finale

        await sharp(inputPath)
          .toFormat("webp")
          .toFile(outputPath); // ✅ Conversion en WebP

        // ✅ Supprime l'ancien fichier temporaire
        fs.unlinkSync(inputPath);

        // ✅ Met à jour `req.files` pour enregistrer le bon chemin en base
        file.filename = outputFilename;
        file.path = `/gmAssets/${file.filename}`;
      })
    );

    next();
  } catch (error) {
    console.error("❌ Erreur lors de la conversion en WebP :", error);
    return res.status(500).json({ message: "Erreur de conversion WebP" });
  }
};

// ✅ Exportation
module.exports = { uploadGmFile, convertToWebp };
