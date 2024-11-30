//middlewares/authMiddleware
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }
      next();
    } catch (error) {
      res.status(401).json({ message: 'Non autorisé, échec du token' });
    }
  } else {
    res.status(401).json({ message: 'Non autorisé, pas de token' });
  }
};
