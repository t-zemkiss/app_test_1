const db = require('../config/db');

const GeneratedImage = {
  async create({ userId, imagePath, modelId }) {
    const sql = \`
      INSERT INTO generated_images (user_id, image_path, model_id)
      VALUES (?, ?, ?);
    \`;
    const values = [userId, imagePath, modelId];

    try {
      const result = await db.query(sql, values);

      if (result.rows && result.rows.insertId) {
        // Fetch the newly created image record to get all fields, including defaults like created_at
        return this.findById(result.rows.insertId);
      } else {
        throw new Error('Image record creation failed, no insertId returned.');
      }
    } catch (error) {
      console.error('Error in GeneratedImage.create:', error.message);
      // Check for foreign key constraint errors if userId does not exist, etc.
      if (error.code === 'ER_NO_REFERENCED_ROW_2') { // MySQL error for foreign key constraint fail
          throw new Error('Invalid user ID provided for image creation.');
      }
      throw error; // Re-throw other errors
    }
  },

  async findById(id) {
    const sql = 'SELECT id, user_id, image_path, model_id, created_at FROM generated_images WHERE id = ?;';
    const { rows } = await db.query(sql, [id]);
    return rows[0]; // Returns undefined if not found
  },

  async findByUserId(userId) {
    const sql = 'SELECT id, user_id, image_path, model_id, created_at FROM generated_images WHERE user_id = ? ORDER BY created_at DESC;';
    const { rows } = await db.query(sql, [userId]);
    return rows; // Returns an array of images, or empty array if none found
  }
};

module.exports = GeneratedImage;
