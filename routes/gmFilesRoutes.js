const express = require("express");
const router = express.Router();
const gmFilesController = require("../controllers/gmFilesController");
const { uploadTempFiles } = require("../middlewares/multer-config");

// 📌 Route pour upload de fichiers (avec conversion WebP)

router.post("/gmfiles/upload", uploadTempFiles.array("files"), gmFilesController.uploadFile);


router.get("/files", gmFilesController.getAllFiles);
router.delete("/files/:id", gmFilesController.deleteFile);
module.exports = router;
