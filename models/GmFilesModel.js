const mongoose = require("mongoose");

const gmFileSchema = new mongoose.Schema({
  tableId: { type: String, required: true },
  type: { type: String, enum: ["image", "text"], required: true },
  title: {type: String, required: true},
  filename: { type: String, required: true },
  content: { type: String, default: "" },
  path: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now, expires: "100d" },
  textFont: {type: String, default: ""},
});

module.exports = mongoose.model("GmFile", gmFileSchema);
