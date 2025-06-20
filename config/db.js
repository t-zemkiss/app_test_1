const mysql = require('mysql2/promise'); // Using the promise wrapper
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ai_image_app_db',
  port: process.env.DB_PORT || 3306, // Default MySQL port
  waitForConnections: true,
  connectionLimit: 10, // Example connection limit
  queueLimit: 0
};

// Create a connection pool
const pool = mysql.createPool(dbConfig);

// Test the connection and log success/failure
pool.getConnection()
  .then(connection => {
    console.log('Connected to the MySQL database successfully!');
    connection.release(); // Release the connection back to the pool
  })
  .catch(err => {
    console.error('Error connecting to the MySQL database:');
    console.error(\`  Error Code: ${err.code}\`);
    console.error(\`  Error Message: ${err.message}\`);
    // process.exit(-1); // Consider if exit is desired on initial connection failure
  });


// Function to execute queries
// The mysql2/promise pool.query() method already returns a promise
// and handles acquiring and releasing connections.
const query = async (sql, params) => {
  // mysql2 uses '?' as placeholders instead of $1, $2, etc.
  // This function assumes that the calling model functions will provide SQL with '?'
  try {
    const [rows, fields] = await pool.query(sql, params);
    return { rows, fields }; // Return both rows and fields for flexibility
  } catch (error) {
    console.error('Database query error:', error.message);
    throw error; // Re-throw the error to be handled by the caller
  }
};

// Function to create tables if they don't exist
// This is a simple approach for development. For production, a more robust migration tool is recommended.
const createTables = async () => {
  let connection;
  try {
    connection = await pool.getConnection(); // Get a connection from the pool
    console.log('Checking/creating database tables (MySQL)...');

    const fs = require('fs').promises;
    const path = require('path');
    const migrationsDir = path.join(__dirname, '../db/migrations');
    const files = await fs.readdir(migrationsDir);
    files.sort(); // Ensure migrations run in order

    for (const file of files) {
      if (file.endsWith('.sql')) {
        const filePath = path.join(migrationsDir, file);
        const scriptContent = await fs.readFile(filePath, 'utf8');

        // MySQL generally doesn't support executing multiple statements in a single .query() call by default for security reasons,
        // unless the connection is specifically configured (multipleStatements: true).
        // For simplicity and safety, we'll assume each .sql file contains one or more statements
        // that can be split by ';' if needed, or are DDL that can run together.
        // A more robust way would be to split statements or use a migration library.
        // Here, we'll try to execute the whole script. If it fails due to multiple statements,
        // the SQL files might need adjustment or the connection needs `multipleStatements: true`.
        // For typical CREATE TABLE IF NOT EXISTS, it should be fine.

        // Splitting by semicolon for individual execution (basic approach)
        const statements = scriptContent.split(';').map(s => s.trim()).filter(s => s.length > 0);

        for (const statement of statements) {
          console.log(\`Executing SQL: ${statement.substring(0,100)}...\`); // Log snippet
          await connection.query(statement);
        }
        console.log(\`Executed migration: ${file}\`);
      }
    }
    console.log('Tables checked/created successfully (MySQL).');
  } catch (err) {
    console.error('Error creating tables (MySQL):', err.message);
    // If using `process.env.NODE_ENV === 'production'`, might not want to auto-create tables.
  } finally {
    if (connection) {
      connection.release(); // Always release the connection
    }
  }
};

module.exports = {
  query, // Export the query function
  // No direct 'connect' needed like pg, pool handles connections.
  // For direct connection access if ever needed: pool.getConnection()
  createTables, // Export createTables to be called on app start
  pool // Exporting pool itself can be useful for transactions
};
