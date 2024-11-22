// controllers/userController.js
const User = require('../models/userModel'); // Exemple d'importation du modèle User
const jwt = require('jsonwebtoken');

// Fonction pour l'inscription d'un utilisateur
exports.register = async (req, res) => {
  try {
    const { name, email, password, rooms, equipments } = req.body;
    console.log('Traitement de l\'inscription pour:', email);

    const user = new User({
      name,
      email,
      password,
      rooms: JSON.parse(rooms),
      equipments: JSON.parse(equipments),
      profileImage: req.file ? req.file.path : '',
    });

    console.log('Utilisateur créé avec les données suivantes:', user);

    await user.save();

    console.log('Utilisateur sauvegardé avec succès.');
    res.status(201).json({
      message: "Utilisateur créé avec succès!",
      user,
    });
  } catch (error) {
    console.error("Erreur lors de l'enregistrement de l'utilisateur", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};


// Fonction pour la connexion d'un utilisateur
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Tentative de connexion avec l\'email:', email);

    const user = await User.findOne({ email });

    if (!user) {
      console.log('Utilisateur non trouvé pour cet email');
      return res.status(404).send('Utilisateur non trouvé');
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      console.log('Mot de passe incorrect pour l\'utilisateur:', email);
      return res.status(400).send('Mot de passe incorrect');
    }

    // Générer un token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    console.log('Connexion réussie, token généré:', token);

    res.status(200).json({
      message: 'Connexion réussie',
      token,
      user: {
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        rooms: user.rooms,
        equipments: user.equipments,
      },
    });
  } catch (err) {
    console.error('Erreur lors de la connexion:', err);
    res.status(500).send('Erreur serveur');
  }
};

// Fonction pour récupérer les informations de l'utilisateur connecté
exports.getProfile = async (req, res) => {
  try {
    // L'ID de l'utilisateur est déjà attaché à la requête (via le middleware protect)
    const user = await User.findById(req.user.id).select('-password'); // On exclut le mot de passe de la réponse

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    res.status(200).json({
      message: 'Utilisateur récupéré avec succès',
      user,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};