const express = require("express");
const router = express.Router();
const { createQuest, getUserQuests } = require("../controllers/questController");
const { protect } = require('../middlewares/authMiddleware');

router.post("/", protect, createQuest);
router.get("/mine", protect, getUserQuests);

module.exports = router;
