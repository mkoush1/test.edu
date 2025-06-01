// writingAssessmentController.js
import writingAssessmentService from '../services/writingAssessmentService.js';
import writingAssessmentTrackerService from '../services/writingAssessmentTrackerService.js';

/**
 * Controller for writing assessment endpoints
 */
class WritingAssessmentController {
  /**
   * Evaluate a writing submission
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async evaluateWriting(req, res) {
    console.log('WritingAssessmentController.evaluateWriting called');
    try {
      const { question, answer } = req.body;
      
      console.log('Request body received:', {
        hasQuestion: !!question,
        questionLength: question?.length || 0,
        hasAnswer: !!answer,
        answerLength: answer?.length || 0
      });
      
      // Validate request
      if (!question || !answer) {
        console.log('Validation failed: Missing question or answer');
        return res.status(400).json({
          success: false,
          message: 'Question and answer are required'
        });
      }
      
      console.log('Validation passed, calling writingAssessmentService.evaluateWriting');
      
      // Call the service to evaluate
      const assessment = await writingAssessmentService.evaluateWriting(question, answer);
      
      // Ensure recommendations are always included
      if (!assessment.recommendations || assessment.recommendations.length === 0) {
        assessment.recommendations = this.getDefaultRecommendations(assessment.overallScore || 0);
        console.log('Added default recommendations to assessment');
      }
      
      console.log('Assessment ready to send:', {
        hasAssessment: !!assessment,
        criteriaCount: assessment?.criteria?.length || 0,
        overallScore: assessment?.overallScore,
        recommendationsCount: assessment?.recommendations?.length || 0
      });
      
      // Return the assessment results
      console.log('Sending successful response to client');
      return res.status(200).json({
        success: true,
        assessment
      });
    } catch (error) {
      console.error('Error in evaluateWriting controller:', {
        message: error.message,
        stack: error.stack
      });
      return res.status(500).json({
        success: false,
        message: 'Failed to evaluate writing',
        error: error.message
      });
    }
  }

  /**
   * Generate a new writing prompt based on level and language
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async generatePrompt(req, res) {
    try {
      const { level, language } = req.query;
      
      console.log('Writing assessment generatePrompt called with query params:', req.query);
      console.log('Generating writing prompt for:', { level, language });
      
      // Validate request
      if (!level || !language) {
        console.error('Missing required parameters:', { level, language });
        return res.status(400).json({
          success: false,
          message: 'Level and language are required'
        });
      }
      
      // Validate level
      const validLevels = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'];
      if (!validLevels.includes(level.toLowerCase())) {
        console.error('Invalid level:', level);
        return res.status(400).json({
          success: false,
          message: 'Invalid level. Must be one of: a1, a2, b1, b2, c1, c2'
        });
      }
      
      // Validate language
      const validLanguages = ['english', 'french'];
      if (!validLanguages.includes(language.toLowerCase())) {
        console.error('Invalid language:', language);
        return res.status(400).json({
          success: false,
          message: 'Invalid language. Must be one of: english, french'
        });
      }
      
      console.log('Validation passed, calling writingAssessmentService.generateWritingPrompt');
      
      // Generate prompt using service
      const prompt = await writingAssessmentService.generateWritingPrompt(level, language);
      
      console.log('Prompt generated successfully:', {
        title: prompt?.title,
        promptLength: prompt?.prompt?.length || 0,
        timeLimit: prompt?.timeLimit,
        wordLimit: prompt?.wordLimit,
        criteriaCount: prompt?.criteria?.length || 0
      });
      
      // Return the generated prompt
      console.log('Sending successful response to client');
      return res.status(200).json({
        success: true,
        prompt
      });
    } catch (error) {
      console.error('Error in generatePrompt controller:', {
        message: error.message,
        stack: error.stack
      });
      return res.status(500).json({
        success: false,
        message: 'Failed to generate writing prompt',
        error: error.message
      });
    }
  }

  /**
   * Check if user can take an assessment (based on cooldown period)
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async checkAssessmentAvailability(req, res) {
    try {
      console.log('WritingAssessmentController.checkAssessmentAvailability called');
      
      const userId = req.user?.id;
      const { language, level } = req.query;
      
      if (!userId) {
        console.log('Validation failed: User not authenticated');
        return res.status(401).json({
          success: false,
          message: 'User must be authenticated to check assessment availability'
        });
      }
      
      if (!language || !level) {
        console.log('Validation failed: Missing language or level');
        return res.status(400).json({
          success: false,
          message: 'Language and level are required parameters'
        });
      }
      
      console.log(`Checking writing assessment availability for user ${userId}, language ${language}, level ${level}`);
      
      // Check if user can take assessment (7-day cooldown)
      const availability = await writingAssessmentTrackerService.canTakeAssessment(
        userId, language, level
      );
      
      if (availability.available) {
        return res.status(200).json({
          success: true,
          canTakeAssessment: true,
          message: 'User can take writing assessment'
        });
      } else {
        // Calculate days remaining
        const now = new Date();
        const daysRemaining = Math.ceil((availability.nextAvailableDate - now) / (24 * 60 * 60 * 1000));
        
        return res.status(200).json({
          success: true,
          canTakeAssessment: false,
          nextAvailableDate: availability.nextAvailableDate,
          daysRemaining: daysRemaining,
          lastAssessment: availability.lastAssessment,
          message: `Cooldown period not yet passed, ${daysRemaining} days remaining`
        });
      }
    } catch (error) {
      console.error('Error in checkAssessmentAvailability controller:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Failed to check assessment availability: ' + error.message,
        error: error.message
      });
    }
  }

  /**
   * Get user's writing assessment history
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async getUserAssessments(req, res) {
    try {
      console.log('WritingAssessmentController.getUserAssessments called');
      
      const userId = req.user?.id;
      
      if (!userId) {
        console.log('Validation failed: User not authenticated');
        return res.status(401).json({
          success: false,
          message: 'User must be authenticated to get assessment history'
        });
      }
      
      console.log(`Getting writing assessment history for user ${userId}`);
      
      // Get user's assessment history
      const assessments = await writingAssessmentTrackerService.getUserAssessments(userId);
      
      return res.status(200).json({
        success: true,
        assessments: assessments.map(assessment => ({
          id: assessment._id,
          language: assessment.language,
          level: assessment.level,
          prompt: assessment.prompt,
          score: assessment.score,
          completedAt: assessment.completedAt,
          nextAvailableDate: assessment.nextAvailableDate,
          criteria: assessment.criteria
        }))
      });
    } catch (error) {
      console.error('Error in getUserAssessments controller:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Failed to get user assessments: ' + error.message,
        error: error.message
      });
    }
  }

  /**
   * Get default recommendations based on score
   * @param {number} score - The assessment score
   * @returns {string[]} - Array of recommendation strings
   */
  getDefaultRecommendations(score) {
    if (score < 40) {
      return [
        'Focus on basic sentence structures and grammar fundamentals.',
        'Build your vocabulary by learning common words and phrases.',
        'Practice writing short, clear paragraphs with a main idea.',
        'Read simple texts in your target language regularly.',
        'Consider working with a language tutor for personalized guidance.'
      ];
    } else if (score < 70) {
      return [
        'Work on connecting your ideas with appropriate transition words.',
        'Expand your vocabulary with more precise and varied word choices.',
        'Practice organizing your writing with clear introduction, body, and conclusion.',
        'Review grammar rules that you find challenging.',
        'Read articles and essays to learn from good writing examples.'
      ];
    } else {
      return [
        'Focus on developing more nuanced arguments in your writing.',
        'Work on incorporating more sophisticated vocabulary and expressions.',
        'Practice writing in different styles and for different purposes.',
        'Study advanced grammar structures to add complexity to your writing.',
        'Read academic texts in your field to understand specialized language use.'
      ];
    }
  }
}

export default new WritingAssessmentController(); 