// cloudinaryRoutes.js
import express from 'express';
import cloudinaryController from '../controllers/cloudinaryController.js';

const router = express.Router();

// POST /api/cloudinary/upload-video - Upload a video to Cloudinary
router.post('/upload-video', cloudinaryController.uploadVideo);

// POST /api/cloudinary/delete-video - Delete a video from Cloudinary
router.post('/delete-video', cloudinaryController.deleteVideo);

export default router; 