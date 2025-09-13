const db = require('../utils/db');

// Get upcoming event
const getUpcomingEvent = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM events ORDER BY date ASC LIMIT 1');
    const event = result.rows[0];
    
    res.json({ event });
  } catch (err) {
    console.error('Error fetching upcoming event:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get stats
const getStats = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM stats LIMIT 1');
    const stats = result.rows[0] || {};
    
    res.json({ stats });
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get packages
const getPackages = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM event_packages ORDER BY price ASC'
    );
    const packages = result.rows;
    
    res.json({ packages });
  } catch (err) {
    console.error('Error fetching packages:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get active speakers
const getSpeakers = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM speakers ORDER BY name ASC');
    const speakers = result.rows;
    
    res.json({ speakers });
  } catch (err) {
    console.error('Error fetching speakers:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get contact info
const getContactInfo = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM contact_info LIMIT 1');
    const contactInfo = result.rows[0] || {};
    
    res.json({ contactInfo });
  } catch (err) {
    console.error('Error fetching contact info:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get all events
const getEvents = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM events ORDER BY date ASC');
    const events = result.rows;
    
    res.json({ events });
  } catch (err) {
    console.error('Error fetching events:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get single event
const getSingleEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM events WHERE id = $1', [id]);
    const event = result.rows[0];
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    res.json({ event });
  } catch (err) {
    console.error('Error fetching event:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get single package
const getSinglePackage = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM event_packages WHERE id = $1', [id]);
    const package = result.rows[0];
    
    if (!package) {
      return res.status(404).json({ error: 'Package not found' });
    }
    
    res.json({ package });
  } catch (err) {
    console.error('Error fetching package:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get single speaker
const getSingleSpeaker = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM speakers WHERE id = $1', [id]);
    const speaker = result.rows[0];
    
    if (!speaker) {
      return res.status(404).json({ error: 'Speaker not found' });
    }
    
    res.json({ speaker });
  } catch (err) {
    console.error('Error fetching speaker:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  getUpcomingEvent,
  getStats,
  getPackages,
  getSpeakers,
  getContactInfo,
  getEvents,
  getSingleEvent,
  getSinglePackage,
  getSingleSpeaker
};