const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    // Add user info to request
    req.user = decoded;

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
}; 