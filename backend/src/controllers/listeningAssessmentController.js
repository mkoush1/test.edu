/**
 * Controller for handling listening assessment API endpoints
 */
class ListeningAssessmentController {
  /**
   * Submit a listening assessment
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @returns {Object} - Response with assessment data
   */
  async submitListeningAssessment(req, res) {
    try {
      const { 
        level, 
        language, 
        score, 
        correctAnswers, 
        totalQuestions, 
        answers, 
        mcqAnswers,
        fillBlanksAnswers, 
        trueFalseAnswers, 
        phraseMatchingAnswers,
        feedback
      } = req.body;
      
      const userId = req.user?._id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }
      
      // Validate required fields
      if (!level || !language || score === undefined || !totalQuestions) {
        return res.status(400).json({
          success: false,
          message: 'Missing required assessment data'
        });
      }
      
      // Import the ListeningAssessment model
      const ListeningAssessment = await import('../models/ListeningAssessment.js')
        .then(module => module.default)
        .catch(err => {
          console.error('Error importing ListeningAssessment model:', err);
          throw new Error('Could not load assessment model');
        });
      
      // Create assessment data object
      const assessmentData = {
        userId,
        level,
        language,
        score,
        correctAnswers: correctAnswers || 0,
        totalQuestions,
        answers: answers || [],
        feedback: feedback || '',
        completedAt: new Date(),
        nextAvailableDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
      };
      
      // Add optional data if provided
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
      
      // Save the assessment
      const assessment = new ListeningAssessment(assessmentData);
      await assessment.save();
      
      return res.status(201).json({
        success: true,
        message: 'Listening assessment submitted successfully',
        assessment
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
   * Check if a user can take a specific listening assessment
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @returns {Object} - Response with availability data
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
      
      // Import the ListeningAssessment model
      const ListeningAssessment = await import('../models/ListeningAssessment.js')
        .then(module => module.default)
        .catch(err => {
          console.error('Error importing ListeningAssessment model:', err);
          throw new Error('Could not load assessment model');
        });
      
      // Use the model's canTakeAssessment method
      const availability = await ListeningAssessment.canTakeAssessment(userId, level, language);
      
      console.log('Availability check result:', availability);
      
      return res.status(200).json({
        success: true,
        ...availability
      });
    } catch (error) {
      console.error('Error in checkAssessmentAvailability controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to check assessment availability',
        error: error.message
      });
    }
  }
  
  /**
   * Get all listening assessments for a user
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @returns {Object} - Response with assessment history
   */
  async getUserListeningAssessments(req, res) {
    try {
      return res.status(200).json({
        success: true,
        history: []
      });
    } catch (error) {
      console.error('Error in getUserListeningAssessments controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch listening assessment history',
        error: error.message
      });
    }
  }
  
  /**
   * Get a specific listening assessment by ID
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @returns {Object} - Response with assessment data
   */
  async getListeningAssessmentById(req, res) {
    try {
      return res.status(200).json({
        success: true,
        assessment: null,
        message: 'Assessment details coming soon'
      });
    } catch (error) {
      console.error('Error in getListeningAssessmentById controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch listening assessment',
        error: error.message
      });
    }
  }
  
  /**
   * Get statistics for a user's listening assessments
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @returns {Object} - Response with statistics data
   */
  async getUserStatistics(req, res) {
    try {
      return res.status(200).json({
        success: true,
        statistics: {
          totalAssessments: 0,
          averageScore: 0,
          progressOverTime: []
        }
      });
    } catch (error) {
      console.error('Error in getUserStatistics controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch assessment statistics',
        error: error.message
      });
    }
  }
}

// Create controller instance
const listeningAssessmentController = new ListeningAssessmentController();
export default listeningAssessmentController; 