const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

// Database configuration with better validation
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ai_image_app_db',
  port: parseInt(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
  queueLimit: parseInt(process.env.DB_QUEUE_LIMIT) || 0,
  multipleStatements: true // Enable for migrations
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
async function testConnection() {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.ping();
    console.log('Successfully connected to MySQL database');
    return true;
  } catch (err) {
    console.error('MySQL connection error:', {
      code: err.code,
      message: err.message
    });
    return false;
  } finally {
    if (connection) await connection.release();
  }
}

// Execute query with better error handling
async function query(sql, params = []) {
  try {
    const [rows, fields] = await pool.query(sql, params);
    return { rows, fields };
  } catch (error) {
    console.error('Database query error:', {
      sql: sql.substring(0, 100) + (sql.length > 100 ? '...' : ''),
      params: params,
      error: error.message
    });
    throw error;
  }
}

// Execute transaction
async function transaction(operations) {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const result = await operations(connection);

    await connection.commit();
    return result;
  } catch (error) {
    if (connection) await connection.rollback();
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

// Migration management
async function runMigrations() {
  let connection;
  try {
    connection = await pool.getConnection();
    console.log('Running database migrations...');

    // Create migrations table if it doesn't exist
    await connection.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Get already executed migrations
    const [executedMigrations] = await connection.query('SELECT name FROM migrations');
    const executedMigrationNames = new Set(executedMigrations.map(m => m.name));

    // Find and run new migrations
    const migrationsDir = path.join(__dirname, '../db/migrations');
    const files = (await fs.readdir(migrationsDir))
      .filter(file => file.endsWith('.sql'))
      .sort();

    let migrationsRun = 0;

    for (const file of files) {
      if (!executedMigrationNames.has(file)) {
        const filePath = path.join(migrationsDir, file);
        const sql = await fs.readFile(filePath, 'utf8');

        console.log(`Running migration: ${file}`);
        await connection.query(sql);
        await connection.query('INSERT INTO migrations (name) VALUES (?)', [file]);
        
        migrationsRun++;
        console.log(`Completed migration: ${file}`);
      }
    }

    if (migrationsRun === 0) {
      console.log('No new migrations to run');
    } else {
      console.log(`Successfully ran ${migrationsRun} migration(s)`);
    }

    return migrationsRun;
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  } finally {
    if (connection) await connection.release();
  }
}

// Graceful shutdown
async function close() {
  try {
    await pool.end();
    console.log('MySQL connection pool closed');
  } catch (error) {
    console.error('Error closing MySQL pool:', error);
  }
}

module.exports = {
  pool,
  query,
  transaction,
  testConnection,
  runMigrations,
  close
};