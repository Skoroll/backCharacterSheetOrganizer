import Character from "../models/characterModel.js";

// 📌 Créer un personnage
export const createCharacter = async (req, res) => {
  try {
    const newCharacter = new Character(req.body);
    await newCharacter.save();
    res.status(201).json(newCharacter);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 📌 Récupérer un personnage par son ID
export const getCharacterById = async (req, res) => {
  try {
    const character = await Character.findById(req.params.id);
    if (!character) {
      return res.status(404).json({ message: "Personnage non trouvé" });
    }
    res.status(200).json(character);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📌 Récupérer tous les personnages
export const getAllCharacters = async (req, res) => {
  try {
    const characters = await Character.find();
    res.status(200).json(characters);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📌 Mettre à jour un personnage
export const updateCharacter = async (req, res) => {
  try {
    const updatedCharacter = await Character.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedCharacter) {
      return res.status(404).json({ message: "Personnage non trouvé" });
    }
    res.status(200).json(updatedCharacter);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 📌 Supprimer un personnage
export const deleteCharacter = async (req, res) => {
  try {
    const deletedCharacter = await Character.findByIdAndDelete(req.params.id);
    if (!deletedCharacter) {
      return res.status(404).json({ message: "Personnage non trouvé" });
    }
    res.status(200).json({ message: "Personnage supprimé avec succès" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
