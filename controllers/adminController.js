const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../utils/db');
const dotenv = require('dotenv');

dotenv.config();

// Admin login
const login = async (req, res) => {
  try {
    const { email, username, password } = req.body;
    
    if ((!email && !username) || !password) {
      return res.status(400).json({ error: 'Email/username and password are required' });
    }
    
    // Support both email and username login
    const query = email 
      ? 'SELECT * FROM admins WHERE email = $1'
      : 'SELECT * FROM admins WHERE username = $1';
    const value = email || username;
    
    const result = await db.query(query, [value]);
    const admin = result.rows[0];
    
    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const isMatch = await bcrypt.compare(password, admin.password);
    
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { 
        id: admin.id, 
        email: admin.email,
        username: admin.username
      },
      process.env.JWT_SECRET,
      { 
        expiresIn: process.env.JWT_EXPIRY || '24h',
        algorithm: 'HS256'
      }
    );
    
    const { password: _, ...adminWithoutPassword } = admin;
    
    res.json({
      message: 'Login successful',
      token,
      admin: adminWithoutPassword
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Check authentication status
const checkAuth = (req, res) => {
  res.json({
    isAuthenticated: true,
    admin: req.admin
  });
};

// Admin logout
const logout = (req, res) => {
  res.json({ message: 'Logout successful' });
};

// Get admin dashboard stats
const getDashboardStats = async (req, res) => {
  try {
    const statsResult = await db.query('SELECT * FROM stats LIMIT 1');
    const stats = statsResult.rows[0] || {};
    
    res.json({ stats });
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Events CRUD
const createEvent = async (req, res) => {
  try {
    const { title, description, date, venue } = req.body;
    
    const result = await db.query(
      'INSERT INTO events (title, description, date, venue) VALUES ($1, $2, $3, $4) RETURNING *',
      [title, description, date, venue]
    );
    
    res.status(201).json({ event: result.rows[0] });
  } catch (err) {
    console.error('Error creating event:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, date, venue } = req.body;
    
    const result = await db.query(
      'UPDATE events SET title = $1, description = $2, date = $3, venue = $4, updated_at = NOW() WHERE id = $5 RETURNING *',
      [title, description, date, venue, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    res.json({ event: result.rows[0] });
  } catch (err) {
    console.error('Error updating event:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query('DELETE FROM events WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    res.json({ message: 'Event deleted successfully' });
  } catch (err) {
    console.error('Error deleting event:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Speakers CRUD
const createSpeaker = async (req, res) => {
  try {
    const { name, bio, company, position } = req.body;
    
    let imageUrl = null;
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }
    
    const result = await db.query(
      'INSERT INTO speakers (name, bio, company, position, image_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, bio, company, position, imageUrl]
    );
    
    res.status(201).json({ speaker: result.rows[0] });
  } catch (err) {
    console.error('Error creating speaker:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

const updateSpeaker = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, bio, company, position } = req.body;
    
    let imageUrl = null;
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }
    
    let result;
    if (imageUrl) {
      result = await db.query(
        'UPDATE speakers SET name = $1, bio = $2, company = $3, position = $4, image_url = $5, updated_at = NOW() WHERE id = $6 RETURNING *',
        [name, bio, company, position, imageUrl, id]
      );
    } else {
      result = await db.query(
        'UPDATE speakers SET name = $1, bio = $2, company = $3, position = $4, updated_at = NOW() WHERE id = $5 RETURNING *',
        [name, bio, company, position, id]
      );
    }
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Speaker not found' });
    }
    
    res.json({ speaker: result.rows[0] });
  } catch (err) {
    console.error('Error updating speaker:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

const deleteSpeaker = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query('DELETE FROM speakers WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Speaker not found' });
    }
    
    res.json({ message: 'Speaker deleted successfully' });
  } catch (err) {
    console.error('Error deleting speaker:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  login,
  checkAuth,
  logout,
  getDashboardStats,
  createEvent,
  updateEvent,
  deleteEvent,
  createSpeaker,
  updateSpeaker,
  deleteSpeaker
};