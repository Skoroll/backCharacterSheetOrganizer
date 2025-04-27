const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
const Npc = require("../models/npcModel");

// Config Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

exports.createNpc = async (req, res) => {
  try {
    const {
      tableId,
      type,
      name,
      location,
      age,
      strength,
      dexterity,
      intelligence,
      charisma,
      endurance,
      inventory,
      specialSkills,
      story,
    } = req.body;

    if (!tableId) return res.status(400).json({ message: "ID de table requis" });

    let imageUrl = "";
    if (req.file) {
      const streamUpload = () => {
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: "npcs",
              transformation: [{ width: 180, height: 180, crop: "fill" }],
              format: "webp",
            },
            (error, result) => {
              if (result) resolve(result);
              else reject(error);
            }
          );
          streamifier.createReadStream(req.file.buffer).pipe(stream);
        });
      };

      const result = await streamUpload();
      imageUrl = result.secure_url;
    }

    const npc = new Npc({
      tableId,
      type,
      image: imageUrl,
      name,
      location,
      age,
      strength,
      dexterity,
      intelligence,
      charisma,
      endurance,
      inventory: JSON.parse(inventory || "[]"),
      specialSkills: JSON.parse(specialSkills || "[]"),
      story,
    });

    await npc.save();
    res.status(201).json(npc);
  } catch (error) {
    console.error("❌ Erreur création PNJ :", error);
    res.status(500).json({ message: "Erreur création PNJ", error });
  }
};


// 📌 Récupérer les PNJs d'une table
exports.getNpcsByTable = async (req, res) => {
  try {
    const { tableId } = req.params;

    if (!tableId) {
      return res.status(400).json({ message: "L'ID de la table est requis." });
    }

    const npcs = await Npc.find({ tableId });
    res.json(npcs);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération des PNJs", error });
  }
};


// Supprimer un PNJ par son _id
exports.deleteNpc = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedNpc = await Npc.findByIdAndDelete(id);

    if (!deletedNpc) {
      return res.status(404).json({ message: "PNJ non trouvé" });
    }

    // 🔥 Suppression de l'image Cloudinary si elle existe
    if (deletedNpc.image) {
      // On extrait le public_id de l'URL (format : https://res.cloudinary.com/.../npcs/<public_id>.webp)
      const segments = deletedNpc.image.split("/");
      const filename = segments[segments.length - 1]; // e.g. wn4jxcrdlv2pgpk2yfwh.webp
      const publicId = `npcs/${filename.split(".")[0]}`; // e.g. npcs/wn4jxcrdlv2pgpk2yfwh

      await cloudinary.uploader.destroy(publicId)
        .then(() => {
        })
        .catch((err) => {
          console.error("❌ Erreur suppression image Cloudinary :", err);
        });
    }

    res.status(200).json({ message: "PNJ supprimé avec succès" });
  } catch (error) {
    console.error("❌ Erreur lors de la suppression du PNJ :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

//Edition de PNJ
exports.updateNpc = async (req, res) => {
  const { id } = req.params;

  const npc = await Npc.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!npc) return res.status(404).json({ message: "PNJ non trouvé" });

  res.status(200).json(npc);
};

