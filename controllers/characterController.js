import Character from "../models/characterModel.js";
import TableTop from "../models/tabletopModel.js";
import Message from "../models/Message.js";
// 📌 Créer un personnage avec image
export const createCharacter = async (req, res) => {
  try {

      // Extraction des données
      const { 
          name, age, className, strength, dexterity, endurance, intelligence, charisma, 
          pointsOfLife, injuries, protection, background,pros, cons, gold, origin, weapons, skills, inventory 
      } = req.body;

      // Vérification des champs obligatoires
      if (!name || !age) {
          return res.status(400).json({ message: "Certains champs obligatoires sont manquants" });
      }

      // Traitement de l'image
      const imagePath = req.file ? `uploads/${req.file.filename}` : null;

      // 📌 Logs avant parsing
      console.log("📌 Weapons avant parsing:", weapons);
      console.log("📌 Skills avant parsing:", skills);
      console.log("📌 Inventory avant parsing:", inventory);

      // Parsing des chaînes JSON envoyées par le front
      const weaponsArr = JSON.parse(weapons || "[]");
      const skillsArr = JSON.parse(skills || "[]");
      const inventoryArr = JSON.parse(inventory || "[]");

      // 📌 Logs après parsing
      console.log("📌 Weapons après parsing:", weaponsArr);
      console.log("📌 Skills après parsing:", skillsArr);
      console.log("📌 Inventory après parsing:", inventoryArr);

      // Création du personnage avec les données parsées
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
          pros,
          cons,
          gold,
          origin,
          image: imagePath,
          weapons: weaponsArr,   // Stocké directement dans le modèle
          skills: skillsArr, 
          inventory: inventoryArr,
          userId: req.user.id
      });

      await newCharacter.save();

      // Générer l'URL de l'image
      const imageUrl = req.file ? `${req.protocol}://${req.get('host')}/${imagePath}` : null;

      res.status(201).json({ 
        message: "Personnage créé avec succès", 
        character: { 
          ...newCharacter._doc, 
          image: imageUrl  
        } 
      });

  } catch (error) {
      console.error("❌ Erreur lors de la création du personnage:", error);
      res.status(500).json({ message: "Erreur interne du serveur", error });
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
    const characters = await Character.find({ userId: req.user.id })
      .populate('weapons')  // Résoudre les références des armes
      .populate('skills')   // Résoudre les références des compétences
      .populate('inventory') // Résoudre les références des objets
      .exec();

    if (!characters) {
      return res.status(404).json({ message: "Aucun personnage trouvé" });
    }

    res.status(200).json({ characters });
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des personnages:", error);
    res.status(500).json({ message: "Erreur interne du serveur", error });
  }
};

export const updateHealth = async (req, res) => {
  try {
    console.log("📥 Requête reçue pour updateHealth :", req.body);

    const { pointsOfLife } = req.body;
    if (pointsOfLife === undefined) {
      return res.status(400).json({ message: "Le champ pointsOfLife est requis" });
    }

    // 🔍 Récupérer le personnage
    const character = await Character.findById(req.params.id);
    if (!character) {
      return res.status(404).json({ message: "Personnage non trouvé" });
    }

    // 🚨 Vérifier si le personnage a un `tableId`
    let tableId = character.tableId;
    if (!tableId) {
      console.warn(`⚠️ Le personnage ${character._id} n'a pas de tableId défini ! Recherche en cours...`);

      // 🔍 Trouver la table contenant ce personnage
      const table = await TableTop.findOne({ "players.selectedCharacter": character._id });

      if (table) {
        console.log(`✅ Table trouvée : ${table._id}`);
        tableId = table._id;

        // 🔹 Mettre à jour le personnage avec la table trouvée
        character.tableId = tableId;
        await character.save();
      } else {
        console.error(`❌ Impossible de trouver une table associée au personnage ${character._id}`);
        return res.status(400).json({ message: "Ce personnage n'est pas associé à une table" });
      }
    }

    console.log(`🔍 Table ID final du personnage : ${tableId}`);

    // ✅ Mettre à jour les PV
    character.pointsOfLife = pointsOfLife;
    await character.save();

    // ✅ Vérifier si l'instance de socket.io est bien récupérée
    const io = req.app.get("io");
    if (!io) {
      console.error("❌ ERREUR : io non trouvé dans req.app !");
      return res.status(500).json({ message: "Erreur serveur : io non défini" });
    }

    // ✅ Émettre l'événement à la bonne salle "table-{tableId}"
    console.log(`📡 Emission de "updateHealth" à table-${tableId}`);
    io.to(`table-${tableId}`).emit("updateHealth", {
      characterId: character._id,
      pointsOfLife: character.pointsOfLife,
    });

    res.json(character);
  } catch (error) {
    console.error("❌ Erreur mise à jour des PV :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
