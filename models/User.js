const db = require('../config/db');
const bcrypt = require('bcryptjs');

const User = {
  async create({ email, password, nombre, creditos }) {
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    const query = \`
      INSERT INTO users (email, password_hash, nombre, creditos)
      VALUES ($1, $2, $3, $4)
      RETURNING id, email, nombre, creditos;
    \`;
    const values = [email, password_hash, nombre, creditos || 100]; // Default to 100 credits if not specified
    const { rows } = await db.query(query, values);
    return rows[0];
  },

  async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1;';
    const { rows } = await db.query(query, [email]);
    return rows[0];
  },

  async findById(id) {
    const query = 'SELECT * FROM users WHERE id = $1;';
    const { rows } = await db.query(query, [id]);
    return rows[0];
  },

  async updateCredits(userId, newCreditAmount) {
    const query = 'UPDATE users SET creditos = $1 WHERE id = $2 RETURNING id, email, nombre, creditos;';
    const { rows } = await db.query(query, [newCreditAmount, userId]);
    return rows[0];
  }
};

module.exports = User;
