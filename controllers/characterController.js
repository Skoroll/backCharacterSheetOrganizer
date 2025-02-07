import Character from "../models/characterModel.js";

// 📌 Créer un personnage avec image
export const createCharacter = async (req, res) => {
  try {
      const { name, age, className, strength, dexterity, endurance, intelligence, charisma, pointsOfLife, injuries, protection, background, gold, origin } = req.body;
      
      if (!name || !age) {
          return res.status(400).json({ message: "Certains champs obligatoires sont manquants" });
      }

      // ✅ Ajoute ici imagePath AVANT d'utiliser new Character()
      const imagePath = req.file ? `uploads/${req.file.filename}` : null;

      const newCharacter = new Character({
          name,
          age,
          className,
          strength,
          dexterity,
          endurance,
          intelligence,
          charisma,
          pointsOfLife,
          injuries,
          protection,
          background,
          gold,
          origin,
          image: imagePath, // ✅ Utilise l'image ici
          userId: req.user.id
      });

      await newCharacter.save();

      // ✅ Génère l'URL complète pour l'image
      const imageUrl = req.file ? `${req.protocol}://${req.get('host')}/${imagePath}` : null;

      res.status(201).json({ 
        message: "Personnage créé avec succès", 
        character: { 
          ...newCharacter._doc, 
          image: imageUrl  // ✅ Renvoie l'URL complète
        } 
      });

  } catch (error) {
      console.error("Erreur lors de la création du personnage:", error);
      res.status(500).json({ message: "Erreur interne du serveur" });
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


// 📌 Récupérer les personnages d'un utilisateur spécifique (authentifié)
export const getUserCharacters = async (req, res) => {
  try {
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    const userId = req.user.id;
    const characters = await Character.find({ userId });

    res.status(200).json(characters);
  } catch (error) {
    console.error("🔴 Erreur dans getUserCharacters :", error);
    res.status(500).json({ message: error.message });
  }
};



export const getCharactersByUser = async (req, res) => {
  try {
    const userId = req.user.id; // Assure-toi que req.user est bien défini
    const characters = await Character.find({ userId }); // Filtrage par userId
    res.json(characters);
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la récupération des personnages." });
  }
};

