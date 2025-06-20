const db = require('../config/db');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid'); // For generating secure tokens if needed

// Default credit allocation
const DEFAULT_CREDITS = 100;

const User = {
  /**
   * Creates a new user in the database
   * @param {Object} userData - User data including email, password, name
   * @returns {Promise<Object>} Created user data (without password hash)
   * @throws {Error} If user creation fails
   */
  async create({ email, password, nombre, creditos = DEFAULT_CREDITS }) {
    try {
      // Validate required fields
      if (!email || !password || !nombre) {
        throw new Error('Missing required fields');
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);

      const sql = `
        INSERT INTO users (email, password_hash, nombre, creditos)
        VALUES (?, ?, ?, ?)
      `;
      const values = [email, password_hash, nombre, creditos];

      const result = await db.query(sql, values);

      if (!result.rows.insertId) {
        throw new Error('User creation failed - no insert ID returned');
      }

      // Return user data without sensitive information
      return {
        id: result.rows.insertId,
        email,
        nombre,
        creditos,
        createdAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('User creation error:', error);
      throw error;
    }
  },

  /**
   * Finds a user by email
   * @param {string} email - User's email address
   * @returns {Promise<Object|null>} User object or null if not found
   */
  async findByEmail(email) {
    try {
      const sql = 'SELECT * FROM users WHERE email = ? LIMIT 1';
      const { rows } = await db.query(sql, [email]);
      return rows[0] || null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  },

  /**
   * Finds a user by ID
   * @param {number} id - User ID
   * @returns {Promise<Object|null>} User object or null if not found
   */
  async findById(id) {
    try {
      const sql = 'SELECT * FROM users WHERE id = ? LIMIT 1';
      const { rows } = await db.query(sql, [id]);
      return rows[0] || null;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw error;
    }
  },

  /**
   * Updates user credits
   * @param {number} userId - User ID to update
   * @param {number} newCreditAmount - New credit amount
   * @returns {Promise<Object>} Updated user data
   * @throws {Error} If update fails
   */
  async updateCredits(userId, newCreditAmount) {
    try {
      // Validate input
      if (!userId || isNaN(newCreditAmount)) {
        throw new Error('Invalid input parameters');
      }

      const sql = 'UPDATE users SET creditos = ? WHERE id = ?';
      await db.query(sql, [newCreditAmount, userId]);

      // Return the updated user record
      const updatedUser = await this.findById(userId);
      if (!updatedUser) {
        throw new Error('User not found after update');
      }
      return updatedUser;
    } catch (error) {
      console.error('Error updating user credits:', error);
      throw error;
    }
  },

  /**
   * Verifies user credentials
   * @param {string} email - User email
   * @param {string} password - Plain text password
   * @returns {Promise<Object|null>} User object if valid, null otherwise
   */
  async verifyCredentials(email, password) {
    try {
      const user = await this.findByEmail(email);
      if (!user) return null;

      const isValid = await bcrypt.compare(password, user.password_hash);
      return isValid ? user : null;
    } catch (error) {
      console.error('Error verifying credentials:', error);
      throw error;
    }
  },

  /**
   * Updates user password
   * @param {number} userId - User ID
   * @param {string} newPassword - New password
   * @returns {Promise<boolean>} True if successful
   */
  async updatePassword(userId, newPassword) {
    try {
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(newPassword, salt);

      const sql = 'UPDATE users SET password_hash = ? WHERE id = ?';
      const result = await db.query(sql, [password_hash, userId]);

      return result.rows.affectedRows > 0;
    } catch (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  }
};

module.exports = User;