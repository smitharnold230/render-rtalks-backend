const express = require('express');
const router = express.Router();

// Import controllers
const {
  getUpcomingEvent,
  getStats,
  getPackages,
  getSpeakers,
  getContactInfo,
  getEvents,
  getSingleEvent,
  getSinglePackage,
  getSingleSpeaker
} = require('../controllers/publicController');

// Public routes
router.get('/upcoming-event', getUpcomingEvent);
router.get('/stats', getStats);
router.get('/packages', getPackages);
router.get('/speakers', getSpeakers);
router.get('/contact', getContactInfo);
router.get('/events', getEvents);
router.get('/events/:id', getSingleEvent);
router.get('/packages/:id', getSinglePackage);
router.get('/speakers/:id', getSingleSpeaker);

module.exports = router;