const express = require("express");
const router = express.Router();
const gmFilesController = require("../controllers/gmFilesController");
const { uploadGmFile } = require("../middlewares/multer-config");
const { protect } = require("../middlewares/authMiddleware");


router.post(
  "/upload",
  protect,
  uploadGmFile.array("files"),
  gmFilesController.uploadFile
);
router.get("/files", gmFilesController.getAllFiles);
router.delete("/files/:id", gmFilesController.deleteFile);

module.exports = router;