// speakingAssessmentRoutes.js
import express from 'express';
import asyncHandler from 'express-async-handler';
import speakingAssessmentController from '../controllers/speakingAssessmentController.js';
import { logRequest } from '../middleware/logMiddleware.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

// Create router
const router = express.Router();

/**
 * @route   GET /api/speaking-assessment/check
 * @desc    Check if a user has already completed an assessment
 */
router.get('/check', logRequest, asyncHandler(speakingAssessmentController.checkAssessment));

/**
 * @route   GET /api/speaking-assessment/user/:userId
 * @desc    Get all assessments for a user
 */
router.get('/user/:userId', asyncHandler(speakingAssessmentController.getUserAssessments));

/**
 * @route   GET /api/speaking-assessment/pending
 * @desc    Get all pending assessments for supervisor review
 */
router.get('/pending', logRequest, asyncHandler(speakingAssessmentController.getPendingAssessments));

/**
 * @route   GET /api/speaking-assessment/evaluated/:assessmentId
 * @desc    Get a specific evaluated assessment by ID
 */
router.get('/evaluated/:assessmentId', logRequest, asyncHandler(speakingAssessmentController.getEvaluatedAssessment));

/**
 * @route   POST /api/speaking-assessment/evaluate
 * @desc    Evaluate a speaking submission
 */
router.post('/evaluate', logRequest, asyncHandler(speakingAssessmentController.evaluateSpeaking));

/**
 * @route   POST /api/speaking-assessment/evaluate/:assessmentId
 * @desc    Submit supervisor evaluation for an assessment
 */
router.post('/evaluate/:assessmentId', logRequest, asyncHandler(speakingAssessmentController.submitSupervisorEvaluation));

/**
 * @route   GET /api/speaking-assessment/availability
 * @desc    Check if user can take an assessment (cooldown period)
 */
router.get('/availability', authMiddleware, asyncHandler(speakingAssessmentController.checkAssessmentAvailability));

/**
 * @route   GET /api/speaking-assessment/user
 * @desc    Get all assessments for the logged-in user
 */
router.get('/user', authMiddleware, asyncHandler(speakingAssessmentController.getUserAssessments));

// Add a test endpoint to check MongoDB connection
router.get('/test-connection', asyncHandler(async (req, res) => {
  try {
    // Import mongoose
    const mongoose = await import('mongoose');
    
    // Check MongoDB connection status
    const state = mongoose.default.connection.readyState;
    const stateMap = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    
    console.log(`MongoDB connection state: ${stateMap[state]} (${state})`);
    
    // Check if SpeakingAssessment model exists
    const modelNames = Object.keys(mongoose.default.models);
    const speakingAssessmentModel = mongoose.default.models.SpeakingAssessment;
    
    // Try to count documents
    let count = 0;
    let collections = [];
    let error = null;
    
    if (state === 1) { // If connected
      try {
        // List collections
        collections = await mongoose.default.connection.db.listCollections().toArray();
        collections = collections.map(c => c.name);
        
        // Count documents in speakingassessments collection
        if (speakingAssessmentModel) {
          count = await speakingAssessmentModel.countDocuments();
        }
      } catch (err) {
        error = {
          message: err.message,
          stack: err.stack
        };
      }
    }
    
    return res.status(200).json({
      success: true,
      connection: {
        state: stateMap[state],
        stateCode: state,
        isConnected: state === 1
      },
      models: {
        available: modelNames,
        hasSpeakingAssessment: !!speakingAssessmentModel
      },
      collections,
      speakingAssessments: {
        count
      },
      error
    });
  } catch (err) {
    console.error('Error in test-connection endpoint:', err);
    return res.status(500).json({
      success: false,
      message: 'Error testing MongoDB connection',
      error: err.message
    });
  }
}));

export default router; 