const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

// Determine the correct database configuration
let poolConfig;

if (process.env.DATABASE_URL) {
  // Use connection string (Render.com or other cloud provider)
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('render.com') ? 
      { rejectUnauthorized: false } : 
      (process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false),
    // Reasonable pool settings
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 20000
  };
} else {
  // Use individual connection parameters (local development)
  poolConfig = {
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'rtalks',
    ssl: process.env.DB_SSL === 'true'
  };
}

// Log configuration (safely)
console.log('Database configuration:', {
  usingConnectionString: !!process.env.DATABASE_URL,
  ssl: !!poolConfig.ssl,
  host: process.env.DATABASE_URL ? 
    new URL(process.env.DATABASE_URL).hostname : 
    poolConfig.host
});

const pool = new Pool(poolConfig);

// Add essential event handlers
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
});

pool.on('connect', () => {
  console.log('Database connected successfully');
});

pool.on('remove', () => {
  console.log('Database connection closed');
});

// Test the database connection with proper error handling
const testConnection = async () => {
  let client;
  try {
    client = await pool.connect();
    
    // Simple test query to verify connection and write permissions
    await client.query('CREATE TABLE IF NOT EXISTS connection_test (id SERIAL PRIMARY KEY)');
    await client.query('DROP TABLE connection_test');
    
    console.log('Database connected successfully');
    return true;
  } catch (err) {
    console.error('Database connection error:', err.message);
    
    // Log helpful error messages based on error codes
    if (err.code === 'ECONNREFUSED') {
      console.error('Connection refused. Check if database is running.');
    } else if (err.code === '28P01') {
      console.error('Invalid credentials. Check username/password.');
    } else if (err.code === '3D000') {
      console.error('Database does not exist. Check database name.');
    } else if (err.code === 'ETIMEDOUT') {
      console.error('Connection timed out. Check network/firewall.');
    }
    
    throw err;
  } finally {
    if (client) {
      client.release();
    }
  }
};

// Export pool and test function
module.exports = {
  query: (text, params) => pool.query(text, params),
  testConnection
};

module.exports = {
  query: (text, params) => pool.query(text, params),
  testConnection
};