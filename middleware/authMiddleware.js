const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      return res.status(401).json({ message: 'User no longer exists' });
    }

    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

module.exports = { protect };

// Authentication middleware for protecting private routes.
// It checks for a JWT token in the browser's cookies.
// If the token is valid, the corresponding user's details are fetched from the database (excluding the password) and attached to req.user.
// If the token is missing, invalid, or the user doesn't exist, a 401 Unauthorized response is returned and access is denied.