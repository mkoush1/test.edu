// writingAssessmentRoutes.js
import express from 'express';
import writingAssessmentController from '../controllers/writingAssessmentController.js';
import communicationController from '../controllers/communicationController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Simple test route to check if the server is responding
router.get('/test', (req, res) => {
  console.log('Test route called');
  return res.status(200).json({
    success: true,
    message: 'Writing assessment API is working',
    timestamp: new Date().toISOString()
  });
});

/**
 * @route POST /api/writing-assessment/evaluate
 * @desc Evaluate a writing submission using AI
 * @access Public
 */
router.post('/evaluate', writingAssessmentController.evaluateWriting);

/**
 * @route POST /api/writing-assessment/submit-communication
 * @desc Submit communication assessment results to database
 * @access Private (requires authentication)
 */
router.post('/submit-communication', authenticateToken, communicationController.submitCommunicationAssessment);

/**
 * @route GET /api/writing-assessment/check
 * @desc Check if user can take an assessment (cooldown period)
 * @access Private (requires authentication)
 */
router.get('/check', authenticateToken, writingAssessmentController.checkAssessmentAvailability);

/**
 * @route GET /api/writing-assessment/history
 * @desc Get user's writing assessment history
 * @access Private (requires authentication)
 */
router.get('/history', authenticateToken, writingAssessmentController.getUserAssessments);

/**
 * @route GET /api/writing-assessment/generate-prompt
 * @desc Generate a new writing prompt based on level and language
 * @access Public
 */
router.get('/generate-prompt', writingAssessmentController.generatePrompt);

export default router; 