import cloudinary from '../config/cloudinary.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Controller for Cloudinary operations
 */
class CloudinaryController {
  /**
   * Upload a video to Cloudinary
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async uploadVideo(req, res) {
    try {
      console.log('CloudinaryController.uploadVideo called');
      
      // Check if file was uploaded
      if (!req.files || !req.files.video) {
        console.log('No video file uploaded');
        return res.status(400).json({
          success: false,
          message: 'No video file uploaded'
        });
      }
      
      // Extract metadata from request
      const { language = 'english', level = 'A1', taskId = '1', userId = 'anonymous' } = req.body;
      
      console.log('Upload metadata:', { language, level, taskId, userId });
      
      // Get the video file
      const videoFile = req.files.video;
      console.log(`Received video: ${videoFile.name}, size: ${videoFile.size} bytes, type: ${videoFile.mimetype}`);
      
      // Create a temp directory if it doesn't exist
      const tempDir = path.join(__dirname, '../temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      // Save the file temporarily
      const tempFilePath = path.join(tempDir, `${Date.now()}_${videoFile.name}`);
      await videoFile.mv(tempFilePath);
      console.log(`Saved temp file to: ${tempFilePath}`);
      
      // Prepare folder structure for Cloudinary
      const folder = `speaking/${language.toLowerCase()}/${level.toUpperCase()}/task${taskId}`;
      
      // Upload to Cloudinary
      console.log(`Uploading to Cloudinary folder: ${folder}`);
      const uploadResult = await cloudinary.uploader.upload(tempFilePath, {
        resource_type: 'video',
        folder: folder,
        public_id: `${userId}_${Date.now()}`,
        overwrite: true,
        resource_type: 'video'
      });
      
      console.log('Cloudinary upload result:', {
        publicId: uploadResult.public_id,
        url: uploadResult.secure_url,
        format: uploadResult.format,
        duration: uploadResult.duration
      });
      
      // Remove temp file
      fs.unlinkSync(tempFilePath);
      console.log(`Removed temp file: ${tempFilePath}`);
      
      // Return success response
      return res.status(200).json({
        success: true,
        message: 'Video uploaded successfully',
        videoUrl: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        duration: uploadResult.duration || 0,
        format: uploadResult.format
      });
      
    } catch (error) {
      console.error('Error in uploadVideo controller:', {
        message: error.message,
        stack: error.stack
      });
      
      return res.status(500).json({
        success: false,
        message: 'Failed to upload video: ' + error.message,
        error: error.message
      });
    }
  }
  
  /**
   * Delete a video from Cloudinary
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async deleteVideo(req, res) {
    try {
      console.log('CloudinaryController.deleteVideo called');
      
      const { publicId } = req.body;
      
      if (!publicId) {
        console.log('No public ID provided');
        return res.status(400).json({
          success: false,
          message: 'Public ID is required'
        });
      }
      
      console.log(`Deleting video with public ID: ${publicId}`);
      
      // Delete from Cloudinary
      const deleteResult = await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
      console.log('Cloudinary delete result:', deleteResult);
      
      return res.status(200).json({
        success: true,
        message: 'Video deleted successfully',
        result: deleteResult
      });
      
    } catch (error) {
      console.error('Error in deleteVideo controller:', {
        message: error.message,
        stack: error.stack
      });
      
      return res.status(500).json({
        success: false,
        message: 'Failed to delete video: ' + error.message,
        error: error.message
      });
    }
  }
}

export default new CloudinaryController(); 