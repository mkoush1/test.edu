import express from 'express';
import readingAssessmentController from '../controllers/readingAssessmentController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Test endpoint without authentication
router.get('/test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Reading assessment API is working'
  });
});

// Apply authentication middleware to all routes except /test
router.use((req, res, next) => {
  if (req.path === '/test') {
    return next();
  }
  authMiddleware(req, res, next);
});

// Submit a reading assessment
router.post('/submit', readingAssessmentController.submitAssessment);

// Check if a user can take a specific reading assessment
router.get('/availability', readingAssessmentController.checkAvailability);

// Get reading assessment data for a specific level and language
router.get('/data', readingAssessmentController.getAssessmentData);

// Get reading assessment history for the current user
router.get('/history', readingAssessmentController.getAssessmentHistory);

// Get reading assessment statistics for the current user
router.get('/statistics', readingAssessmentController.getStatistics);

// Fix export for ESM
const readingAssessmentRoutes = router;
export default readingAssessmentRoutes; 