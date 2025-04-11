const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  {
    tableId: {
      type: String,
      required: true,
    },    
    name: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String },
    type: {
      type: String,
      enum: ["melee", "ranged", "equipment", "vehicle", "service", "food", "accessories"],
      required: true,
    },
    use: String,       // Armes de mêlée
    damages: String,   // Armes de mêlée et distance
    range: String,     // Armes à distance
  },
  { timestamps: true }
);

module.exports = mongoose.model("Item", itemSchema);
