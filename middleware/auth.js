const jwt = require('jsonwebtoken');
const db = require('../utils/db');

const authenticateAdmin = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token, authorization denied' });
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if admin exists
    const result = await db.query('SELECT * FROM admins WHERE id = $1', [decoded.id]);
    const admin = result.rows[0];

    if (!admin) {
      return res.status(401).json({ error: 'Token is not valid' });
    }

    // Remove password from admin object
    const { password, ...adminWithoutPassword } = admin;

    // Add admin to request
    req.admin = adminWithoutPassword;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token is not valid' });
  }
};

module.exports = authenticateAdmin;