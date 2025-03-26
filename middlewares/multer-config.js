const multer = require("multer");
const storage = multer.memoryStorage();
const uploadGmFile = multer({ storage });
module.exports = { uploadGmFile };