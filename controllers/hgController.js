const User = require('../models/User');
const GeneratedImage = require('../models/GeneratedImage');
const path = require('path');
const fs = require('fs').promises; // Using promises version of fs
// const axios = require('axios'); // For actual HF API call later - keep commented for now
require('dotenv').config();


// Define directories
const MULTER_UPLOAD_DIR = path.join(__dirname, '../uploads'); // As configured in uploadMiddleware
const FINAL_IMAGES_SUBDIR = 'images'; // Subdirectory within uploads for "processed" images
const FINAL_IMAGES_DIR = path.join(MULTER_UPLOAD_DIR, FINAL_IMAGES_SUBDIR);

// Ensure the final images directory exists
const ensureFinalImagesDirExists = async () => {
  try {
    await fs.mkdir(FINAL_IMAGES_DIR, { recursive: true });
    // console.log('Final images directory ensured:', FINAL_IMAGES_DIR);
  } catch (error) {
    // Log critical error if directory cannot be created, as it's needed for operation
    console.error('CRITICAL: Error creating final images directory:', FINAL_IMAGES_DIR, error);
    // Depending on severity, you might want to throw to stop app, or handle gracefully
  }
};
ensureFinalImagesDirExists(); // Call it on module load

exports.generateImage = async (req, res, next) => {
  if (!req.file) {
    // This should ideally be caught by uploadMiddleware if field name is wrong or no file
    return res.status(400).json({ success: false, message: 'No image file uploaded.' });
  }

  const userId = req.user.id; // From 'protect' middleware
  const creditCost = req.creditCost; // From 'checkCredits' middleware
  const uploadedFilePath = req.file.path; // Full path from multer (e.g., uploads/image-timestamp.ext)
  const originalFilename = req.file.originalname;

  try {
    // --- Simulate Hugging Face API Interaction ---
    // In a real scenario:
    // 1. Read the image file: const imageBuffer = await fs.readFile(uploadedFilePath);
    // 2. Prepare FormData: const formData = new FormData(); formData.append('image', imageBuffer, originalFilename);
    // 3. API Call:
    //    const hfResponse = await axios.post(process.env.HF_MODEL_ENDPOINT, formData, {
    //      headers: {
    //        'Authorization': \`Bearer ${process.env.HF_API_KEY}\`,
    //        ...formData.getHeaders() // If using 'form-data' library
    //      },
    //      responseType: 'arraybuffer' // if image is returned directly
    //    });
    // 4. Save the hfResponse.data (processed image) to a new file.
    //    const processedImageFilename = \`processed-\${Date.now()}-\${originalFilename}\`;
    //    const processedImageFinalPath = path.join(FINAL_IMAGES_DIR, processedImageFilename);
    //    await fs.writeFile(processedImageFinalPath, hfResponse.data);
    //    const finalImagePathForDb = path.join(FINAL_IMAGES_SUBDIR, processedImageFilename); // Relative to 'uploads'

    // For simulation: We "process" it by moving it to the final subdirectory
    console.log(`Simulating processing for: ${originalFilename} uploaded at ${uploadedFilePath}`);

    // Generate a new unique filename for the "processed" image
    const uniqueProcessedFilename = `\${Date.now()}-\${path.basename(originalFilename).replace(/\s+/g, '_')}`;
    const finalProcessedPath = path.join(FINAL_IMAGES_DIR, uniqueProcessedFilename);

    // Move the file from multer's upload location to the final "processed" location
    await fs.rename(uploadedFilePath, finalProcessedPath);
    console.log(`Simulated processed image moved to: ${finalProcessedPath}`);

    const imagePathForDb = path.join('/', 'uploads', FINAL_IMAGES_SUBDIR, uniqueProcessedFilename).replace(/\\/g, '/');


    // --- Database Logging ---
    const modelIdUsed = process.env.DEFAULT_HF_MODEL_ID || 'simulated_model_v1';
    const dbRecord = await GeneratedImage.create({
      userId,
      imagePath: imagePathForDb, // Store relative path for URL access
      modelId: modelIdUsed,
    });

    // --- Deduct Credits ---
    const newCreditTotal = req.user.creditos - creditCost;
    const updatedUser = await User.updateCredits(userId, newCreditTotal);

    res.status(200).json({
      success: true,
      message: 'Image processed and saved successfully (simulation).',
      generatedImageUrl: imagePathForDb,
      creditsRemaining: updatedUser.creditos, // Use credits from the updated user object
      record: dbRecord,
    });

  } catch (error) {
    console.error('Error in generateImage controller:', error.message);
    // Attempt to cleanup the uploaded file if it still exists and an error occurred
    // Note: uploadedFilePath is where multer saved it. If fs.rename failed partially,
    // or if error happened before rename, it might still be there.
    // If rename succeeded but a later step failed, the file is at finalProcessedPath.
    // For simplicity, we only try to clean up uploadedFilePath if it exists.
    try {
      if (await fs.stat(uploadedFilePath).catch(() => false)) {
        await fs.unlink(uploadedFilePath);
        console.log('Cleaned up temporary uploaded file:', uploadedFilePath);
      }
    } catch (cleanupError) {
      console.error('Error cleaning up temp file during error handling:', cleanupError.message);
    }
    next(error); // Pass error to global error handler
  }
};

// Controller to get user's generated images
exports.getUserImages = async (req, res, next) => {
  try {
    const userId = req.user.id; // Assuming 'protect' middleware is used
    const images = await GeneratedImage.findByUserId(userId);
    res.status(200).json({
      success: true,
      data: images,
    });
  } catch (error) {
    console.error('Error fetching user images:', error.message);
    next(error);
  }
};
