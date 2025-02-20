const mongoose = require("mongoose");

const gmFileSchema = new mongoose.Schema({
  tableId: { type: String, required: true }, // ✅ Associer un fichier à une table
  type: { type: String, enum: ["image", "text"], required: true },
  filename: { type: String, required: true },
  content: { type: String, default: "" },
  path: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now, expires: "30d" },
});

module.exports = mongoose.model("GmFile", gmFileSchema);
