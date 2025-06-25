const db = require('../config/db');
const bcrypt = require('bcryptjs');

const User = {
  async create({ email, password, nombre, creditos }) {
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const insertSql = \`
      INSERT INTO users (email, password_hash, nombre, creditos)
      VALUES (?, ?, ?, ?);
    \`;
    const insertValues = [email, password_hash, nombre, creditos === undefined ? 100 : creditos];

    try {
      const result = await db.query(insertSql, insertValues);

      if (result.rows && result.rows.insertId) {
        // Fetch the newly created user to get all fields, including defaults from DB
        return this.findById(result.rows.insertId);
      } else {
        // This case should ideally not be reached if the query was successful and db.query works as expected
        throw new Error('User creation failed, no insertId returned.');
      }
    } catch (error) {
      // Log or handle specific errors, e.g., duplicate email
      if (error.code === 'ER_DUP_ENTRY') { // MySQL error code for duplicate entry
        throw new Error('Email already exists.');
      }
      console.error('Error in User.create:', error.message);
      throw error; // Re-throw the error to be handled by the controller
    }
  },

  async findByEmail(email) {
    const sql = 'SELECT id, email, password_hash, nombre, creditos FROM users WHERE email = ?;';
    const { rows } = await db.query(sql, [email]);
    return rows[0]; // Returns undefined if not found, which is fine
  },

  async findById(id) {
    const sql = 'SELECT id, email, nombre, creditos FROM users WHERE id = ?;'; // Excluded password_hash
    const { rows } = await db.query(sql, [id]);
    return rows[0]; // Returns undefined if not found
  },

  // Method to find user for authentication purposes (includes password_hash)
  async findForAuth(email) {
    const sql = 'SELECT id, email, password_hash, nombre, creditos FROM users WHERE email = ?;';
    const { rows } = await db.query(sql, [email]);
    return rows[0];
  },

  async updateCredits(userId, newCreditAmount) {
    const sql = 'UPDATE users SET creditos = ? WHERE id = ?;';

    try {
      const result = await db.query(sql, [newCreditAmount, userId]);
      if (result.rows && result.rows.affectedRows > 0) {
        return this.findById(userId); // Fetch and return the updated user
      } else if (result.rows && result.rows.affectedRows === 0) {
        // No rows updated, could mean user not found or value was the same
        // Depending on desired behavior, could throw error or return null/current data
        const existingUser = await this.findById(userId);
        if (!existingUser) {
            throw new Error('User not found for credit update.');
        }
        return existingUser; // Value was the same, return current user data
      } else {
        throw new Error('Failed to update user credits.');
      }
    } catch (error) {
      console.error('Error in User.updateCredits:', error.message);
      throw error;
    }
  },

  // Utility to compare password (can be part of the User model or auth service)
  async comparePassword(candidatePassword, hash) {
    return bcrypt.compare(candidatePassword, hash);
  }
};

module.exports = User;
