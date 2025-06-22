const mongoose = require("mongoose");

const gmFileSchema = new mongoose.Schema({
  tableId: { type: String, required: true },
  type: { type: String, enum: ["image", "text"], required: true },
  title: { type: String, required: true },
  filename: { type: String, required: true },
  content: { type: String, default: "" },
  path: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now }, 
  textFont: { type: String, default: "" },
  textColor: { type: String, default: "" },
  isBG: { type: Boolean, default: true },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

// Index TTL : expire 100 jours après la création
gmFileSchema.index({ createdAt: 1 }, { expireAfterSeconds: 8640000 });

module.exports = mongoose.model("GmFile", gmFileSchema);
