const db = require('../config/db');

const GeneratedImage = {
  /**
   * Creates a new generated image record
   * @param {Object} params - Contains userId, imagePath, and modelId
   * @param {number} params.userId - ID of the user who generated the image
   * @param {string} params.imagePath - Path to the stored image
   * @param {string} params.modelId - ID of the model used for generation
   * @returns {Promise<Object>} The created image record with all fields
   * @throws {Error} If creation fails
   */
  async create({ userId, imagePath, modelId }) {
    try {
      // Validate input parameters
      if (!userId || !imagePath || !modelId) {
        throw new Error('Missing required parameters (userId, imagePath, modelId)');
      }

      const sql = `
        INSERT INTO generated_images (user_id, image_path, model_id)
        VALUES (?, ?, ?);
      `;
      const values = [userId, imagePath, modelId];
      
      const result = await db.query(sql, values);

      if (!result.rows?.insertId) {
        throw new Error('Failed to create image record - no insert ID returned');
      }

      // Fetch and return the complete record including auto-generated fields
      return await this.findById(result.rows.insertId);
    } catch (error) {
      console.error('Error creating generated image:', error);
      throw error;
    }
  },

  /**
   * Finds an image by its ID
   * @param {number} id - Image ID to search for
   * @returns {Promise<Object|null>} Image record or null if not found
   */
  async findById(id) {
    try {
      const sql = `
        SELECT id, user_id, image_path, model_id, created_at
        FROM generated_images 
        WHERE id = ?
        LIMIT 1;
      `;
      const { rows } = await db.query(sql, [id]);
      return rows[0] || null;
    } catch (error) {
      console.error('Error finding image by ID:', error);
      throw error;
    }
  },

  /**
   * Finds all images for a specific user with pagination
   * @param {number} userId - User ID to search for
   * @param {Object} [options] - Pagination options
   * @param {number} [options.limit=20] - Maximum number of results
   * @param {number} [options.offset=0] - Pagination offset
   * @returns {Promise<Array>} Array of image records
   */
  async findByUserId(userId, { limit = 20, offset = 0 } = {}) {
    try {
      if (!userId) {
        throw new Error('userId parameter is required');
      }

      const sql = `
        SELECT id, user_id, image_path, model_id, created_at
        FROM generated_images 
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?;
      `;
      const { rows } = await db.query(sql, [userId, limit, offset]);
      return rows;
    } catch (error) {
      console.error('Error finding images by user ID:', error);
      throw error;
    }
  },

  /**
   * Counts all images for a specific user
   * @param {number} userId - User ID to count images for
   * @returns {Promise<number>} Total count of images
   */
  async countByUserId(userId) {
    try {
      const sql = 'SELECT COUNT(*) as count FROM generated_images WHERE user_id = ?';
      const { rows } = await db.query(sql, [userId]);
      return parseInt(rows[0].count, 10);
    } catch (error) {
      console.error('Error counting user images:', error);
      throw error;
    }
  },

  /**
   * Deletes an image record
   * @param {number} imageId - ID of the image to delete
   * @param {number} [userId] - Optional user ID for ownership verification
   * @returns {Promise<boolean>} True if deletion was successful
   */
  async delete(imageId, userId = null) {
    try {
      let sql = 'DELETE FROM generated_images WHERE id = ?';
      const params = [imageId];

      // Add user verification if provided
      if (userId) {
        sql += ' AND user_id = ?';
        params.push(userId);
      }

      const result = await db.query(sql, params);
      return result.rows.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  },

  /**
   * Gets recent images across all users
   * @param {Object} [options] - Pagination options
   * @param {number} [options.limit=20] - Maximum number of results
   * @param {number} [options.offset=0] - Pagination offset
   * @returns {Promise<Array>} Array of recent image records
   */
  async getRecentImages({ limit = 20, offset = 0 } = {}) {
    try {
      const sql = `
        SELECT id, user_id, image_path, model_id, created_at
        FROM generated_images
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?;
      `;
      const { rows } = await db.query(sql, [limit, offset]);
      return rows;
    } catch (error) {
      console.error('Error fetching recent images:', error);
      throw error;
    }
  }
};

module.exports = GeneratedImage;