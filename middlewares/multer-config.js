const multer = require("multer");

//Multer stocke les fichiers en mémoire (dans un buffer)
const storage = multer.memoryStorage();

const uploadGmFile = multer({ storage });

module.exports = { uploadGmFile };
