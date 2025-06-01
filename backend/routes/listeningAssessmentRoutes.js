import express from 'express';
import listeningAssessmentController from '../controllers/listeningAssessmentController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Check if a user can take a specific listening assessment (place this route before others to avoid conflicts)
router.get('/availability/:level/:language', listeningAssessmentController.checkAssessmentAvailability);

// Get listening assessment statistics for the current user
router.get('/statistics/user', listeningAssessmentController.getUserStatistics);

// Get listening assessment statistics for a specific user (admin/supervisor only)
router.get('/statistics/user/:userId', listeningAssessmentController.getUserStatistics);

// Get all listening assessments for the current user
router.get('/user', listeningAssessmentController.getUserListeningAssessments);

// Get all listening assessments for a specific user (admin/supervisor only)
router.get('/user/:userId', listeningAssessmentController.getUserListeningAssessments);

// Submit a listening assessment
router.post('/submit', listeningAssessmentController.submitListeningAssessment);

// Get a specific listening assessment by ID (keep this last to avoid route conflicts)
router.get('/:assessmentId', listeningAssessmentController.getListeningAssessmentById);

export default router; 