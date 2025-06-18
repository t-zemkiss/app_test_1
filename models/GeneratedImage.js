const db = require('../config/db');

const GeneratedImage = {
  async create({ userId, imagePath, modelId }) {
    const query = \`
      INSERT INTO generated_images (user_id, image_path, model_id)
      VALUES ($1, $2, $3)
      RETURNING id, user_id, image_path, model_id, created_at;
    \`;
    const values = [userId, imagePath, modelId];
    const { rows } = await db.query(query, values);
    return rows[0];
  },

  async findByUserId(userId) {
    const query = 'SELECT * FROM generated_images WHERE user_id = $1 ORDER BY created_at DESC;';
    const { rows } = await db.query(query, [userId]);
    return rows;
  }
};

module.exports = GeneratedImage;
