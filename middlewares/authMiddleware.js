const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

exports.protect = async (req, res, next) => {
  let token;

  // Vérification de la présence du token dans les en-têtes
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1]; // Extraire le token
      console.log('Token reçu:', token); // Log du token pour suivi

      // Vérification de la validité du token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token décodé:', decoded); // Log du token décodé

      // Récupération de l'utilisateur à partir de l'ID du token, sans inclure le mot de passe
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }

      next(); // Continuer avec la requête si tout va bien
    } catch (error) {
      console.error('Erreur de vérification du token:', error); // Log de l'erreur
      res.status(401).json({ message: 'Non autorisé, échec du token' });
    }
  }

  // Si le token n'est pas présent dans les en-têtes
  if (!token) {
    console.log('Aucun token trouvé dans les en-têtes de la requête');
    res.status(401).json({ message: 'Non autorisé, pas de token' });
  }
};
