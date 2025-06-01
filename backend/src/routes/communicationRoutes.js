import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import communicationController from '../controllers/communicationController.js';

const router = express.Router();

// Get aggregated communication assessment data
router.get('/aggregate', authenticateToken, communicationController.getCommunicationAssessments);

// Submit communication assessment results (already exists in the controller)
router.post('/submit', authenticateToken, communicationController.submitCommunicationAssessment);

export default router; 