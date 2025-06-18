const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 5432, // Default PG port
});

pool.on('connect', () => {
  console.log('Connected to the database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Function to create tables if they don't exist
// This is a simple approach for development. For production, a more robust migration tool is recommended.
const createTables = async () => {
  const client = await pool.connect();
  try {
    // Read and execute migration files sequentially
    const fs = require('fs').promises;
    const path = require('path');
    const migrationsDir = path.join(__dirname, '../db/migrations');
    const files = await fs.readdir(migrationsDir);
    files.sort(); // Ensure migrations run in order

    for (const file of files) {
      if (file.endsWith('.sql')) {
        const filePath = path.join(migrationsDir, file);
        const script = await fs.readFile(filePath, 'utf8');
        console.log(`Executing migration: ${file}`);
        await client.query(script);
      }
    }
    console.log('Tables checked/created successfully.');
  } catch (err) {
    console.error('Error creating tables:', err.stack);
  } finally {
    client.release();
  }
};

module.exports = {
  query: (text, params) => pool.query(text, params),
  connect: () => pool.connect(),
  createTables, // Export createTables to be called on app start
};
