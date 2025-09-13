const express = require('express');
const router = express.Router();

// Import controllers
const {
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
} = require('../controllers/adminController');

// Import middlewares
const authenticateAdmin = require('../middleware/auth');
const upload = require('../middleware/upload');

// Auth routes
router.post('/login', login);
router.get('/check-auth', authenticateAdmin, checkAuth);
router.post('/logout', authenticateAdmin, logout);

// Dashboard
router.get('/dashboard', authenticateAdmin, getDashboardStats);

// Events CRUD
router.post('/events', authenticateAdmin, createEvent);
router.put('/events/:id', authenticateAdmin, updateEvent);
router.delete('/events/:id', authenticateAdmin, deleteEvent);

// Speakers CRUD
router.post('/speakers', authenticateAdmin, upload.single('image'), createSpeaker);
router.put('/speakers/:id', authenticateAdmin, upload.single('image'), updateSpeaker);
router.delete('/speakers/:id', authenticateAdmin, deleteSpeaker);

module.exports = router;