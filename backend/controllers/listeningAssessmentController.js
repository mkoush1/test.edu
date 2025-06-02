import listeningAssessmentService from '../services/listeningAssessmentService.js';
import ListeningAssessment from '../models/ListeningAssessment.js';
import mongoose from 'mongoose';

/**
 * Controller for listening assessment endpoints
 */
class ListeningAssessmentController {
  constructor() {
    // Bind instance methods to this context
    this.submitListeningAssessment = this.submitListeningAssessment.bind(this);
    this.checkAssessmentAvailability = this.checkAssessmentAvailability.bind(this);
    this.getUserListeningAssessments = this.getUserListeningAssessments.bind(this);
    this.getListeningAssessmentById = this.getListeningAssessmentById.bind(this);
    this.getUserStatistics = this.getUserStatistics.bind(this);
  }

  /**
   * Submit a listening assessment to the database
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async submitListeningAssessment(req, res) {
    try {
      const { level, language, score, correctAnswers, totalQuestions, answers, mcqAnswers, 
              fillBlanksAnswers, trueFalseAnswers, phraseMatchingAnswers, feedback } = req.body;
      
      // Get user ID from the authenticated user
      const userId = req.user?._id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }
      
      // Check if user is allowed to take this assessment (not in cooldown period)
      const canTakeAssessment = await listeningAssessmentService.checkAssessmentAvailability(userId, level, language);
      
      if (!canTakeAssessment.available) {
        return res.status(403).json({
          success: false,
          message: 'You must wait 7 days between assessment attempts',
          nextAvailableDate: canTakeAssessment.nextAvailableDate,
          previousAssessment: canTakeAssessment.previousAssessment
        });
      }
      
      // Prepare assessment data
      const assessmentData = {
        userId,
        level,
        language,
        score,
        correctAnswers,
        totalQuestions,
        answers,
        feedback,
        completedAt: new Date(),
        nextAvailableDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
      };
      
      // Add optional fields if provided
      if (mcqAnswers) {
        assessmentData.mcqAnswers = new Map(Object.entries(mcqAnswers));
      }
      
      if (fillBlanksAnswers) {
        assessmentData.fillBlanksAnswers = new Map(Object.entries(fillBlanksAnswers));
      }
      
      if (trueFalseAnswers) {
        assessmentData.trueFalseAnswers = new Map(Object.entries(trueFalseAnswers));
      }
      
      if (phraseMatchingAnswers) {
        assessmentData.phraseMatchingAnswers = new Map(Object.entries(phraseMatchingAnswers));
      }
      
      // Submit assessment
      const listeningAssessment = await listeningAssessmentService.submitAssessment(assessmentData);
      
      return res.status(201).json({
        success: true,
        message: 'Listening assessment submitted successfully',
        assessment: listeningAssessment
      });
    } catch (error) {
      console.error('Error in submitListeningAssessment controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to submit listening assessment',
        error: error.message
      });
    }
  }

  /**
   * Check if a user can take a listening assessment
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async checkAssessmentAvailability(req, res) {
    try {
      const { level, language } = req.params;
      const userId = req.user?._id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }
      
      const availability = await listeningAssessmentService.checkAssessmentAvailability(userId, level, language);
      
      return res.status(200).json({
        success: true,
        ...availability
      });
    } catch (error) {
      console.error('Error checking listening assessment availability:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to check assessment availability',
        error: error.message
      });
    }
  }

  /**
   * Get all listening assessments for a user
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async getUserListeningAssessments(req, res) {
    try {
      const userId = req.params.userId || req.user?._id;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }
      
      // Check if user has permission to view assessments
      // For non-admins/supervisors, they can only view their own assessments
      if (req.user.role !== 'admin' && req.user.role !== 'supervisor' && 
          userId !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to view these assessments'
        });
      }
      
      const assessments = await listeningAssessmentService.getUserAssessments(userId);
      
      return res.status(200).json({
        success: true,
        assessments
      });
    } catch (error) {
      console.error('Error getting user listening assessments:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get user assessments',
        error: error.message
      });
    }
  }

  /**
   * Get a specific listening assessment by ID
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async getListeningAssessmentById(req, res) {
    try {
      const { assessmentId } = req.params;
      
      if (!assessmentId || !mongoose.Types.ObjectId.isValid(assessmentId)) {
        return res.status(400).json({
          success: false,
          message: 'Valid assessment ID is required'
        });
      }
      
      const assessment = await listeningAssessmentService.getAssessmentById(assessmentId);
      
      if (!assessment) {
        return res.status(404).json({
          success: false,
          message: 'Assessment not found'
        });
      }
      
      // Check if user has permission to view this assessment
      if (req.user.role !== 'admin' && req.user.role !== 'supervisor' && 
          assessment.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to view this assessment'
        });
      }
      
      return res.status(200).json({
        success: true,
        assessment
      });
    } catch (error) {
      console.error('Error getting listening assessment by ID:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get listening assessment',
        error: error.message
      });
    }
  }

  /**
   * Get listening assessment statistics for a user
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async getUserStatistics(req, res) {
    try {
      const userId = req.params.userId || req.user?._id;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }
      
      // Check if user has permission to view statistics
      if (req.user.role !== 'admin' && req.user.role !== 'supervisor' && 
          userId !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to view these statistics'
        });
      }
      
      const statistics = await listeningAssessmentService.getUserStatistics(userId);
      
      return res.status(200).json({
        success: true,
        statistics
      });
    } catch (error) {
      console.error('Error getting user listening assessment statistics:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get assessment statistics',
        error: error.message
      });
    }
  }
}

export default new ListeningAssessmentController(); 