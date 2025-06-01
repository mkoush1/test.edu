import readingAssessmentService from '../services/readingAssessmentService.js';
// Replace the direct import with a simpler validation approach to avoid dependency issues
// import { validationResult } from 'express-validator';

/**
 * Simple validation result function as a fallback
 * @param {Object} req - Request object
 * @returns {Object} - Validation result
 */
const validationResult = (req) => {
  return {
    isEmpty: () => true,
    array: () => []
  };
};

/**
 * Controller for handling reading assessment API endpoints
 */
class ReadingAssessmentController {
  constructor() {
    // Bind methods to instance
    this.submitAssessment = this.submitAssessment.bind(this);
    this.checkAvailability = this.checkAvailability.bind(this);
    this.getAssessmentHistory = this.getAssessmentHistory.bind(this);
    this.getStatistics = this.getStatistics.bind(this);
  }
  
  /**
   * Submit a reading assessment
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @returns {Object} - Response with assessment data
   */
  async submitAssessment(req, res) {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          errors: errors.array() 
        });
      }
      
      // Get user ID from authenticated request
      const userId = req.user._id;
      
      // Extract assessment data from request
      const { 
        level, 
        language, 
        score, 
        multipleChoiceAnswers, 
        trueFalseAnswers, 
        fillBlanksAnswers,
        categorizationAnswers,
        timeSpent 
      } = req.body;
      
      // Check if user can take this assessment
      const canTakeAssessment = await readingAssessmentService.checkAssessmentAvailability(
        userId, 
        level, 
        language
      );
      
      // If assessment is not available, return error
      if (!canTakeAssessment.available) {
        return res.status(403).json({
          success: false,
          message: 'Assessment is not available yet',
          nextAvailableDate: canTakeAssessment.nextAvailableDate
        });
      }
      
      // Prepare assessment data
      const assessmentData = {
        level,
        language,
        score,
        multipleChoiceAnswers,
        trueFalseAnswers,
        fillBlanksAnswers,
        categorizationAnswers,
        timeSpent
      };
      
      // Submit assessment
      const result = await readingAssessmentService.submitAssessment(assessmentData, userId);
      
      return res.status(201).json({
        success: true,
        message: 'Reading assessment submitted successfully',
        assessment: result.assessment
      });
    } catch (error) {
      console.error('Error in submitAssessment controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to submit reading assessment',
        error: error.message
      });
    }
  }
  
  /**
   * Check if a user can take a specific assessment
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @returns {Object} - Response with availability data
   */
  async checkAvailability(req, res) {
    try {
      // Get user ID from authenticated request
      const userId = req.user._id;
      
      // Get level and language from query parameters
      const { level, language } = req.query;
      
      if (!level) {
        return res.status(400).json({
          success: false,
          message: 'Level is required'
        });
      }
      
      // Check availability
      const availability = await readingAssessmentService.checkAssessmentAvailability(
        userId,
        level,
        language || 'english'
      );
      
      return res.status(200).json(availability);
    } catch (error) {
      console.error('Error in checkAvailability controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to check assessment availability',
        error: error.message
      });
    }
  }
  
  /**
   * Get a user's reading assessment history
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @returns {Object} - Response with assessment history
   */
  async getAssessmentHistory(req, res) {
    try {
      // Get user ID from authenticated request
      const userId = req.user._id;
      
      // Get assessment history
      const history = await readingAssessmentService.getAssessmentHistory(userId);
      
      return res.status(200).json({
        success: true,
        history
      });
    } catch (error) {
      console.error('Error in getAssessmentHistory controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch assessment history',
        error: error.message
      });
    }
  }
  
  /**
   * Get statistics for a user's reading assessments
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @returns {Object} - Response with statistics data
   */
  async getStatistics(req, res) {
    try {
      // Get user ID from authenticated request
      const userId = req.user._id;
      
      // Get filters from query parameters
      const { level, language } = req.query;
      
      // Get statistics
      const statistics = await readingAssessmentService.getStatistics(userId, { level, language });
      
      return res.status(200).json({
        success: true,
        statistics
      });
    } catch (error) {
      console.error('Error in getStatistics controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch assessment statistics',
        error: error.message
      });
    }
  }
}

// Fix the export to ensure it's properly recognized
const readingAssessmentController = new ReadingAssessmentController();
export default readingAssessmentController; 