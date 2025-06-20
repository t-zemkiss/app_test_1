const db = require('../config/db');

const GeneratedImage = {
  async create({ userId, imagePath, modelId }) {
    const sql = \`
      INSERT INTO generated_images (user_id, image_path, model_id)
      VALUES (?, ?, ?);
    \`;
    const values = [userId, imagePath, modelId];
    const result = await db.query(sql, values);

    if (result.rows && result.rows.insertId) {
      // Return a representation of the created image record
      return {
        id: result.rows.insertId,
        user_id: userId,
        image_path: imagePath,
        model_id: modelId
        // created_at would be set by DB default, not easily returned here without another query
      };
    }
    return null; // Or throw error
  },

  async findByUserId(userId) {
    const sql = 'SELECT * FROM generated_images WHERE user_id = ? ORDER BY created_at DESC;';
    const { rows } = await db.query(sql, [userId]);
    return rows;
  }
};

module.exports = GeneratedImage;
