const jwt = require('jsonwebtoken');
const User = require('../models/User');
require('dotenv').config();

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach user to request object, excluding password_hash
      req.user = await User.findById(decoded.id);
      if (req.user) {
        delete req.user.password_hash; // Ensure password hash is not passed around
      } else {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }
      next();
    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const checkCredits = async (req, res, next) => {
  const costPerGeneration = parseInt(process.env.INFO_VARIABLE_CREDITO_COSTE, 10);

  if (isNaN(costPerGeneration) || costPerGeneration < 0) {
    console.error('INFO_VARIABLE_CREDITO_COSTE is not configured properly in .env');
    return res.status(500).json({ message: 'Server configuration error for credit cost.' });
  }

  if (!req.user || typeof req.user.creditos === 'undefined') {
    // This should ideally be caught by 'protect' middleware if user is not found
    return res.status(401).json({ message: 'User not authenticated or user data incomplete.' });
  }

  if (req.user.creditos < costPerGeneration) {
    return res.status(403).json({ message: 'Insufficient credits to generate image.' });
  }

  req.creditCost = costPerGeneration; // Pass cost to the controller
  next();
};

module.exports = { protect, checkCredits };
