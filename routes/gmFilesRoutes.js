const express = require("express");
const router = express.Router();
const gmFilesController = require("../controllers/gmFilesController");
const { uploadGmFile } = require("../middlewares/multer-config");

router.post("/upload", uploadGmFile.array("files"), gmFilesController.uploadFile);
router.get("/files", gmFilesController.getAllFiles);
router.delete("/files/:id", gmFilesController.deleteFile);

module.exports = router;