const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

// Configuration de stockage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Dossier où les fichiers seront enregistrés
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

// Filtrage des fichiers (facultatif, pour accepter uniquement les images)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Veuillez télécharger une image uniquement'), false);
  }
};

// Middleware multer
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 1024 * 1024 * 5 }, // Limite à 5 Mo
});

// Middleware pour convertir l'image en .webp avec redimensionnement
const convertToWebpWithResize = async (req, res, next) => {
  if (!req.file) return next(); // Si aucun fichier n'est téléchargé, continuer

  const originalFilePath = path.join('uploads', req.file.filename);
  const webpFilePath = originalFilePath.replace(path.extname(originalFilePath), '.webp');

  try {
    // Convertir et redimensionner l'image
    await sharp(originalFilePath)
      .resize({
        width: 800, // Largeur maximale
        height: 800, // Hauteur maximale
        fit: 'inside', // Maintient le ratio à l'intérieur des dimensions
      })
      .webp({ quality: 80 }) // Conversion avec une qualité de 80%
      .toFile(webpFilePath);

    // Supprimer le fichier d'origine
    fs.unlinkSync(originalFilePath);

    // Mettre à jour les informations du fichier dans la requête
    req.file.filename = path.basename(webpFilePath);
    req.file.path = webpFilePath;

    next();
  } catch (error) {
    next(error); // Passer l'erreur au middleware de gestion des erreurs
  }
};

module.exports = { upload, convertToWebpWithResize };
