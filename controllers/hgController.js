const User = require('../models/User');
const GeneratedImage = require('../models/GeneratedImage');
const path = require('path');
const fs = require('fs').promises; // Using promises version of fs
const axios = require('axios'); // For actual HF API call later
require('dotenv').config();

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(__dirname, '../uploads'); // For temporary uploads by multer
const FINAL_IMAGES_DIR = path.join(__dirname, '../uploads/images'); // For final processed images

const ensureUploadsDirExists = async () => {
  try {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
    await fs.mkdir(FINAL_IMAGES_DIR, { recursive: true });
    console.log('Uploads directories ensured.');
  } catch (error) {
    console.error('Error creating uploads directories:', error);
  }
};
ensureUploadsDirExists(); // Call it on module load

exports.makeItNow = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No image file uploaded.' });
  }

  const userId = req.user.id;
  const creditCost = req.creditCost; // From checkCredits middleware
  const originalImagePath = req.file.path; // Path from multer (temporary)
  const originalFilename = req.file.originalname;

  try {
    // --- Simulate Hugging Face API Interaction ---
    // In a real scenario:
    // 1. Read the image file (e.g., await fs.readFile(originalImagePath))
    // 2. Prepare FormData or appropriate payload for HF API
    // 3. const hfResponse = await axios.post(process.env.HF_MODEL_ENDPOINT, formData, {
    //      headers: { 'Authorization': \`Bearer ${process.env.HF_API_KEY}\`, ... },
    //      responseType: 'arraybuffer' // if image is returned directly
    //    });
    // 4. Save the hfResponse.data (processed image) to a new file.

    // For simulation: We'll just "process" it by moving/copying it to the final directory
    console.log(\`Simulating Hugging Face processing for: ${originalFilename}\`);
    const uniqueFilename = \`\${Date.now()}-\${originalFilename.replace(/\s+/g, '_')}\`;
    const finalImagePath = path.join(FINAL_IMAGES_DIR, uniqueFilename);

    // Move the file from multer's temp location to the final destination
    await fs.rename(originalImagePath, finalImagePath);
    console.log(\`Simulated processed image saved to: ${finalImagePath}\`);
    // If multer saves with no extension, you might need to handle that based on mimetype
    // For now, assuming originalFilename includes extension.

    // --- Database Logging ---
    const modelIdUsed = process.env.DEFAULT_HF_MODEL_ID || 'simulated_model_v1';
    const dbRecord = await GeneratedImage.create({
      userId,
      imagePath: \`/uploads/images/\${uniqueFilename}\`, // Store relative path for URL
      modelId: modelIdUsed,
    });

    // --- Deduct Credits ---
    const newCreditTotal = req.user.creditos - creditCost;
    await User.updateCredits(userId, newCreditTotal);

    res.status(200).json({
      message: 'Image processed and saved successfully (simulation).',
      generatedImageUrl: dbRecord.image_path, // URL to access the image
      creditsRemaining: newCreditTotal,
      record: dbRecord,
    });

  } catch (error) {
    console.error('Error in makeItNow controller:', error);
    // Cleanup temp file if it still exists and an error occurred after upload
    if (originalImagePath) {
      try {
        await fs.unlink(originalImagePath);
      } catch (cleanupError) {
        console.error('Error cleaning up temp file:', cleanupError);
      }
    }
    res.status(500).json({ message: 'Server error during image generation.' });
  }
};
