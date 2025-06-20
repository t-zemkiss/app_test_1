const db = require('../config/db');
const bcrypt = require('bcryptjs');

const User = {
  async create({ email, password, nombre, creditos }) {
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    // MySQL uses ? for placeholders
    const sql = \`
      INSERT INTO users (email, password_hash, nombre, creditos)
      VALUES (?, ?, ?, ?);
    \`;
    // For mysql2, the insert operation doesn't automatically return the inserted row by default like RETURNING in PG.
    // We'll get an OkPacket, then we can find the user.
    const values = [email, password_hash, nombre, creditos || 100];
    const result = await db.query(sql, values);

    // result.rows for mysql2 pool.query (as wrapped in our db.js) will be an OkPacket for INSERTs.
    // The actual 'rows' from a SELECT are in result.rows. For INSERT, result.rows[0] is not the user.
    // result.rows from our db.query is actually the direct 'rows' for SELECT, or OkPacket for INSERT/UPDATE.
    // So, if result.rows.insertId is available, it's an insert.
    if (result.rows && result.rows.insertId) {
      return { id: result.rows.insertId, email, nombre, creditos: creditos || 100 };
    }
    // Fallback or error if insertId not found, though it should be there for successful INSERT.
    // Or, we might need to do a follow-up SELECT if we need the full row as confirmed by DB.
    // For now, returning the input data with new ID is common.
    return null; // Or throw error
  },

  async findByEmail(email) {
    const sql = 'SELECT * FROM users WHERE email = ?;';
    const { rows } = await db.query(sql, [email]); // db.query returns { rows, fields }
    return rows[0]; // rows is the array of results
  },

  async findById(id) {
    const sql = 'SELECT * FROM users WHERE id = ?;';
    const { rows } = await db.query(sql, [id]);
    return rows[0];
  },

  async updateCredits(userId, newCreditAmount) {
    const sql = 'UPDATE users SET creditos = ? WHERE id = ?;';
    // For UPDATE, mysql2 returns an OkPacket. We don't get the updated row back directly with RETURNING.
    await db.query(sql, [newCreditAmount, userId]);
    // We should re-fetch the user if we need the updated record, or assume success.
    // For simplicity, let's fetch:
    return this.findById(userId); // Assumes findById is correct
  }
};

module.exports = User;
