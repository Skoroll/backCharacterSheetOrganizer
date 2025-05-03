const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const uploadMiddleware = require('../middlewares/uploadMiddleware');  // Assure-toi que le chemin est correct
const fs = require('fs');
const path = require('path');
const nodemailer = require("nodemailer");

const SECRET = process.env.JWT_SECRET || "secret"; 
const FRONT_URL = process.env.FRONT_URL || "http://localhost:5173";

// Vérifier et créer le répertoire `uploads` si nécessaire
const uploadDir = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Fonction pour générer un token d'accès
const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '15m' });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Route pour rafraîchir le token
exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token manquant" });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    const newAccessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
    const newRefreshToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({ accessToken: newAccessToken, newRefreshToken });
  } catch (error) {
    res.status(403).json({ message: "Refresh token invalide" });
  }
};


// Fonction pour l'inscription d'un utilisateur
exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Les champs 'name', 'email' et 'password' sont obligatoires." });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    res.status(201).json({
      message: "Utilisateur créé avec succès.",
      user: { id: newUser._id, email: newUser.email, name: newUser.name },
    });
  } catch (err) {
    console.error("Erreur lors de la création de l'utilisateur :", err);
    if (err.code === 11000) {
      return res.status(409).json({ message: "Un utilisateur avec cet email existe déjà." });
    }
    res.status(500).json({ message: "Erreur interne du serveur." });
  }
};

// Fonction pour la connexion d'un utilisateur
exports.login = async (req, res) => {
  const { name, password } = req.body;

  if (!name || !password) {
    return res.status(400).json({ message: "Les champs 'name' et 'password' sont obligatoires." });
  }

  try {
    const user = await User.findOne({ name });
    if (!user) {
      return res.status(401).json({ message: "Nom ou mot de passe incorrect." });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {

      return res.status(401).json({ message: "Nom ou mot de passe incorrect." });
    }

    console.log("Utilisateur authentifié :", user);

    const accessToken = jwt.sign({ id: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET, { expiresIn: '1d' });
    const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    user.refreshToken = refreshToken; 
    await user.save();

    res.status(200).json({
      message: 'Connexion réussie',
      accessToken,
      refreshToken,
      user: { id: user._id, name: user.name, email: user.email },
    });

  } catch (err) {
    console.error("Erreur lors de la connexion :", err);
    res.status(500).json({ message: "Erreur interne du serveur." });
  }
};

// Fonction pour récupérer plusieurs utilisateurs par leurs IDs
exports.getPlayersByIds = async (req, res) => {
  const playerIds = req.query.ids.split(','); // Récupère les IDs depuis la query string

  try {
    // Recherche les utilisateurs avec les IDs fournis
    const players = await User.find({ '_id': { $in: playerIds } }).select('-password');

    if (!players || players.length === 0) {
      return res.status(404).json({ message: 'Aucun joueur trouvé.' });
    }

    res.status(200).json(players); // Retourne les joueurs trouvés
  } catch (error) {
    console.error('Erreur lors de la récupération des joueurs :', error);
    res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
};

// Fonction pour récupérer les informations de l'utilisateur connecté
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    res.status(200).json({
      message: 'Utilisateur récupéré avec succès',
      user,
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};


// Fonction pour la modification du profil
exports.updateUser = async (req, res) => {
  try {
    
    const userId = req.user.id;
    const { name, email, password, oldPassword } = req.body; // Ajout du `oldPassword`
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }

    // Vérifier et modifier le mot de passe si nécessaire
    if (password) {
      // Vérifier si l'ancien mot de passe est correct
      if (!oldPassword) {
        return res.status(400).json({ message: 'L\'ancien mot de passe est requis.' });
      }
      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'L\'ancien mot de passe est incorrect.' });
      }
    
      // Hacher le nouveau mot de passe avant de le sauvegarder
      user.password = await bcrypt.hash(password, 10);
    }
    // Préparer les mises à jour
    const updates = {
      ...(name && { name }),
      ...(email && { email }),
    };
    
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(password, salt);
    }
    
    if (req.file) {
      updates.profileImage = req.file.path.replace(/\\/g, '/');
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updates,
      { new: true, runValidators: true }
    ).select('-password'); // Exclure le mot de passe du retour

    if (!updatedUser) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }

    res.status(200).json({
      message: 'Profil mis à jour avec succès.',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour :', error);
    res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
};

// Fonction pour supprimer un utilisateur et ses tâches
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.user.id; // Identifiant de l'utilisateur connecté (authMiddleware requis)

    // Vérifie si l'utilisateur existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable." });
    }

    // Supprimer l'image de profil de l'utilisateur si elle existe
    if (user.profileImage) {
      const imagePath = path.join(__dirname, '..', user.profileImage);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath); // Supprimer l'image
      }
    }

    // Supprime l'utilisateur
    await User.findByIdAndDelete(userId);

    res.status(200).json({ message: "Utilisateur et ses tâches supprimés avec succès." });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'utilisateur :", error);
    res.status(500).json({ message: "Erreur interne du serveur." });
  }
};


// Fonction pour récupérer un utilisateur spécifique par son ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur :', error);
    res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
};

//Demande de réinitialisation**
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Utilisateur non trouvé." });

    // Générer un token de réinitialisation (valable 15 minutes)
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "15m" });

    // Configuration de Nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // Mot de passe d'application
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    // Création du lien de réinitialisation
    const resetLink = `${FRONT_URL}reset-password/${token}`;

    // Envoi de l'e-mail
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Réinitialisation de votre mot de passe",
      text: `Bonjour ${user.name}, cliquez sur ce lien pour réinitialiser votre mot de passe : ${resetLink}`,
      html: `
        <p>Bonjour <strong>${user.name}</strong>,</p>
        <p>Vous avez demandé la réinitialisation de votre mot de passe pour votre compte CritRoller.</p>
        <p>
          Cliquez ici pour le réinitialiser : <a href="${resetLink}">${resetLink}</a><br/>
          Ce lien expirera dans 15 minutes.
        </p>
        <p>Si vous n'avez pas fait cette demande, ignorez simplement cet e-mail.</p>
        <br/>
        <p>L'équipe <strong>CritRoller</strong></p>
      `,
    });

    res.json({ message: "E-mail de réinitialisation envoyé." });

  } catch (error) {
    console.error("Erreur lors de l'envoi de l'e-mail :", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
};


//Vérifier la validité du token**
exports.verifyResetToken = async (req, res) => {
  try {
    jwt.verify(req.params.token, SECRET);
    res.json({ message: "Token valide." });
  } catch (error) {
    res.status(400).json({ message: "Token invalide ou expiré." });
  }
};

// Mise à jour du mot de passe**
exports.resetPasswordRequest = async (req, res) => {
  const { password } = req.body;
  const { token } = req.params;

  try {

    const decoded = jwt.verify(token, process.env.JWT_SECRET); 

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: "Aucun utilisateur trouvé." });
    }

    // Hacher le mot de passe et l'enregistrer
    user.password = await bcrypt.hash(password, 10);
    await user.save();

    res.json({ message: "✅ Mot de passe réinitialisé avec succès !" });

  } catch (error) {
    console.error("❌ Erreur lors de la réinitialisation :", error);
    res.status(400).json({ message: "Token invalide ou expiré." });
  }
};


// Déconnexion (suppression du refresh token)
exports.logout = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user) {
      user.refreshToken = null;
      await user.save();
    }
    res.status(200).json({ message: "Déconnexion réussie" });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.removeTableFromUser = async (req, res) => {
  const userId = req.user.id; // depuis le token
  const { tableId } = req.params;

  try {
    await User.findByIdAndUpdate(userId, {
      $pull: { tablesJoined: tableId },
    });

    res.status(200).json({ message: "Table retirée du profil utilisateur" });
  } catch (err) {
    console.error("❌ Erreur suppression table du profil :", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// Recevoir le webhook de Ko-fi
exports.handleKofiWebhook = async (req, res) => {
  const { email, type, tier_name } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email manquant dans le webhook Ko-fi" });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé avec cet email" });
    }

    user.isPremium = true;
    user.kofiTier = tier_name || "Ko-fi Supporter";

    // Facultatif : durée d'un mois premium
    const ONE_MONTH = 1000 * 60 * 60 * 24 * 30;
    user.premiumUntil = new Date(Date.now() + ONE_MONTH);

    await user.save();

    res.status(200).json({ message: "Statut premium mis à jour avec succès" });
  } catch (error) {
    console.error("Erreur Webhook Ko-fi:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};