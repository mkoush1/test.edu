import express from 'express';
import { authenticateJWT } from '../middleware/auth.middleware.js';
import {
  getPendingSpeakingAssessments,
  getSpeakingAssessmentById,
  evaluateSpeakingAssessment
} from '../controllers/speakingAssessment.controller.js';

const router = express.Router();

// Get all pending speaking assessments that need supervisor review
router.get('/pending', authenticateJWT, getPendingSpeakingAssessments);

// Get a specific speaking assessment by ID
router.get('/:id', authenticateJWT, getSpeakingAssessmentById);

// Submit supervisor evaluation for a speaking assessment
router.post('/:id/evaluate', authenticateJWT, evaluateSpeakingAssessment);

export default router; 