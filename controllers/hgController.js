const User = require('../models/User');
const GeneratedImage = require('../models/GeneratedImage');
const path = require('path');
const fs = require('fs').promises;
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// Configuration constants
const UPLOADS_DIR = path.join(__dirname, '../uploads');
const FINAL_IMAGES_DIR = path.join(__dirname, '../uploads/images');
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const DEFAULT_MODEL_ID = process.env.DEFAULT_HF_MODEL_ID || 'simulated_model_v1';
const SIMULATION_MODE = process.env.NODE_ENV === 'development';

/**
 * Ensures upload directories exist
 */
async function ensureUploadsDirExists() {
  try {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
    await fs.mkdir(FINAL_IMAGES_DIR, { recursive: true });
    console.log('Upload directories verified');
  } catch (error) {
    console.error('Failed to create upload directories:', error);
    throw new Error('Server configuration error');
  }
}

// Initialize directories on startup
ensureUploadsDirExists().catch(err => {
  console.error('Critical startup error:', err);
  process.exit(1);
});

/**
 * Processes an image using Hugging Face API or simulation
 * @param {Buffer} imageBuffer - The image file buffer
 * @param {string} mimeType - The image MIME type
 * @returns {Promise<Buffer>} - Processed image buffer
 */
async function processImage(imageBuffer, mimeType) {
  if (SIMULATION_MODE) {
    console.log('Running in simulation mode - skipping actual processing');
    return imageBuffer;
  }

  try {
    const response = await axios.post(
      process.env.HF_MODEL_ENDPOINT,
      imageBuffer,
      {
        headers: {
          'Authorization': `Bearer ${process.env.HF_API_KEY}`,
          'Content-Type': mimeType
        },
        responseType: 'arraybuffer',
        timeout: 30000
      }
    );
    return response.data;
  } catch (error) {
    console.error('Hugging Face API error:', error.response?.data || error.message);
    throw new Error('Image processing failed');
  }
}

/**
 * Generates a unique filename with proper extension
 * @param {string} originalName - Original filename
 * @param {string} mimeType - File MIME type
 * @returns {string} - Unique filename
 */
function generateUniqueFilename(originalName, mimeType) {
  const ext = mimeType.split('/')[1] || 'bin';
  const cleanName = originalName.replace(/[^\w.-]/g, '_');
  return `${uuidv4()}-${cleanName}.${ext}`;
}

/**
 * Handles image generation requests
 */
exports.generateImage = async (req, res) => {
  // Validate request
  if (!req.file) {
    return res.status(400).json({ 
      success: false,
      error: 'No image file uploaded'
    });
  }

  if (!ALLOWED_MIME_TYPES.includes(req.file.mimetype)) {
    await fs.unlink(req.file.path).catch(console.error);
    return res.status(400).json({
      success: false,
      error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed'
    });
  }

  const { id: userId, creditos: currentCredits } = req.user;
  const creditCost = req.creditCost;
  const { path: tempPath, originalname, mimetype } = req.file;

  try {
    // Verify user has sufficient credits
    if (currentCredits < creditCost) {
      throw new Error('Insufficient credits');
    }

    // Read the uploaded file
    const imageBuffer = await fs.readFile(tempPath);

    // Process the image (real or simulated)
    const processedBuffer = await processImage(imageBuffer, mimetype);

    // Save the processed image
    const uniqueFilename = generateUniqueFilename(originalname, mimetype);
    const finalPath = path.join(FINAL_IMAGES_DIR, uniqueFilename);
    await fs.writeFile(finalPath, processedBuffer);

    // Create database record
    const imageRecord = await GeneratedImage.create({
      userId,
      imagePath: `/uploads/images/${uniqueFilename}`,
      modelId: DEFAULT_MODEL_ID
    });

    // Update user credits
    const newCredits = currentCredits - creditCost;
    await User.updateCredits(userId, newCredits);

    // Cleanup temp file
    await fs.unlink(tempPath);

    // Return success response
    res.status(200).json({
      success: true,
      data: {
        imageUrl: imageRecord.image_path,
        creditsRemaining: newCredits,
        imageId: imageRecord.id
      }
    });

  } catch (error) {
    console.error('Image generation error:', error);

    // Cleanup temp file if it exists
    if (tempPath) {
      await fs.unlink(tempPath).catch(console.error);
    }

    const statusCode = error.message === 'Insufficient credits' ? 402 : 500;
    res.status(statusCode).json({
      success: false,
      error: error.message || 'Image processing failed'
    });
  }
};