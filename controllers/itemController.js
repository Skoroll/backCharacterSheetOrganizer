const Item = require("../models/item");

exports.createItem = async (req, res) => {
  if (!req.body.tableId) {
    return res.status(400).json({ message: "ID de table manquant" });
  }
  try {
    const item = new Item(req.body);
    await item.save();
    res.status(201).json(item);
  } catch (err) {
    console.error("Erreur création d'objet :", err);
    res.status(400).json({ message: "Erreur lors de la création de l'objet", err });
  }
};

exports.getItems = async (req, res) => {
  try {
    const { tableId } = req.query;
    if (!tableId) {
      return res.status(400).json({ message: "ID de table requis" });
    }

    const items = await Item.find({ tableId });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la récupération", err });
  }
};


exports.deleteItem = async (req, res) => {
  try {
    const deleted = await Item.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Objet non trouvé" });
    res.json({ message: "Objet supprimé avec succès" });
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la suppression", err });
  }
};
