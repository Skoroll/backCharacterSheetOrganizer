const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

// Configuration de stockage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.resolve('uploads'); // Utilise un chemin absolu
    // Crée le dossier s'il n'existe pas
    if (!fs.existsSync(uploadDir)) {
      try {
        fs.mkdirSync(uploadDir, { recursive: true }); // Crée tous les sous-dossiers nécessaires
        console.log(`Répertoire créé : ${uploadDir}`);
      } catch (error) {
        console.error(`Erreur lors de la création du répertoire : ${uploadDir}`, error);
        return cb(new Error('Erreur lors de la création du répertoire de stockage'));
      }
    }
    cb(null, uploadDir);
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

  const originalFilePath = path.resolve('uploads', req.file.filename);
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

    // Vérification de la création du fichier .webp
    if (fs.existsSync(webpFilePath)) {
      console.log(`Fichier converti créé à : ${webpFilePath}`);
    } else {
      console.log('La conversion a échoué, fichier .webp non trouvé');
      return next(new Error('La conversion de l\'image en .webp a échoué'));
    }

    // Supprimer le fichier d'origine si la conversion a réussi
    if (fs.existsSync(originalFilePath)) {
      fs.unlinkSync(originalFilePath);
      console.log('Fichier d\'origine supprimé');
    }

    // Mettre à jour les informations du fichier dans la requête
    req.file.filename = path.basename(webpFilePath);
    req.file.path = webpFilePath;

    next();
  } catch (error) {
    console.error('Erreur lors de la conversion :', error);
    next(error); // Passer l'erreur au middleware de gestion des erreurs
  }
};

module.exports = { upload, convertToWebpWithResize };
