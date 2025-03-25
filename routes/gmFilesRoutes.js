const express = require("express");
const router = express.Router();
const gmFilesController = require("../controllers/gmFilesController");
const { uploadGmFile, convertToWebp } = require("../middlewares/multer-config");

// 📌 Route pour upload de fichiers (avec conversion WebP)
router.post("/upload", uploadGmFile.array("files", 10), convertToWebp, gmFilesController.uploadFile);

router.get("/files", gmFilesController.getAllFiles);
router.delete("/files/:id", gmFilesController.deleteFile);
module.exports = router;
