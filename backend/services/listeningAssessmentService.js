import ListeningAssessment from '../models/ListeningAssessment.js';
import User from '../models/User.js';

/**
 * Service for handling listening assessment operations
 */
class ListeningAssessmentService {
  /**
   * Submit a new listening assessment result
   * @param {Object} assessmentData - Assessment data to save
   * @returns {Promise<Object>} Saved assessment
   */
  async submitAssessment(assessmentData) {
    try {
      // Create a new assessment
      const listeningAssessment = new ListeningAssessment(assessmentData);
      
      // Save to database
      await listeningAssessment.save();
      
      // Update user's completed assessments if needed
      if (assessmentData.userId) {
        const user = await User.findById(assessmentData.userId);
        
        if (user) {
          // Check if the user already has this assessment type
          const existingAssessmentIndex = user.completedAssessments.findIndex(
            a => a.assessmentType === 'listening'
          );
          
          if (existingAssessmentIndex !== -1) {
            // Update the existing assessment
            user.completedAssessments[existingAssessmentIndex] = {
              assessmentType: 'listening',
              completedAt: new Date(),
              score: assessmentData.score
            };
          } else {
            // Add a new assessment entry
            user.completedAssessments.push({
              assessmentType: 'listening',
              completedAt: new Date(),
              score: assessmentData.score
            });
            
            // Increment the total assessments completed
            user.totalAssessmentsCompleted += 1;
          }
          
          // Update user progress (optional, depends on how you calculate progress)
          // This assumes you want to update progress based on total assessments
          // You might need to adjust this logic based on your app's requirements
          const totalAssessmentTypes = 6; // Example: reading, writing, listening, speaking, etc.
          user.progress = Math.min(100, (user.totalAssessmentsCompleted / totalAssessmentTypes) * 100);
          
          await user.save();
        }
      }
      
      return listeningAssessment;
    } catch (error) {
      console.error('Error submitting listening assessment:', error);
      throw error;
    }
  }

  /**
   * Check if a user can take a listening assessment (not in cooldown)
   * @param {string} userId - User ID
   * @param {string} level - CEFR level
   * @param {string} language - Language
   * @returns {Promise<Object>} Availability status
   */
  async checkAssessmentAvailability(userId, level, language) {
    try {
      // Use the model's static method to check availability
      return await ListeningAssessment.canTakeAssessment(userId, level, language);
    } catch (error) {
      console.error('Error checking assessment availability:', error);
      throw error;
    }
  }

  /**
   * Get listening assessment history for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Assessment history
   */
  async getUserAssessments(userId) {
    try {
      // Find all assessments for this user
      return await ListeningAssessment.find({ userId })
        .sort({ completedAt: -1 })
        .exec();
    } catch (error) {
      console.error('Error getting user listening assessments:', error);
      throw error;
    }
  }

  /**
   * Get listening assessment by ID
   * @param {string} assessmentId - Assessment ID
   * @returns {Promise<Object>} Assessment data
   */
  async getAssessmentById(assessmentId) {
    try {
      return await ListeningAssessment.findById(assessmentId).exec();
    } catch (error) {
      console.error('Error getting listening assessment by ID:', error);
      throw error;
    }
  }

  /**
   * Get user's most recent listening assessment for a level and language
   * @param {string} userId - User ID
   * @param {string} level - CEFR level
   * @param {string} language - Language
   * @returns {Promise<Object>} Most recent assessment
   */
  async getMostRecentAssessment(userId, level, language) {
    try {
      return await ListeningAssessment.findOne({
        userId,
        level,
        language
      }).sort({ completedAt: -1 }).exec();
    } catch (error) {
      console.error('Error getting most recent listening assessment:', error);
      throw error;
    }
  }

  /**
   * Get listening assessment statistics for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Assessment statistics
   */
  async getUserStatistics(userId) {
    try {
      // Get all assessments for this user
      const assessments = await ListeningAssessment.find({ userId }).exec();
      
      // If no assessments found, return default stats
      if (!assessments || assessments.length === 0) {
        return {
          totalAssessments: 0,
          averageScore: 0,
          highestScore: 0,
          recentScores: [],
          levelBreakdown: {},
          languageBreakdown: {}
        };
      }
      
      // Calculate statistics
      const totalAssessments = assessments.length;
      const scores = assessments.map(a => a.score);
      const averageScore = scores.reduce((a, b) => a + b, 0) / totalAssessments;
      const highestScore = Math.max(...scores);
      
      // Get 5 most recent scores
      const recentScores = assessments
        .sort((a, b) => b.completedAt - a.completedAt)
        .slice(0, 5)
        .map(a => ({
          score: a.score,
          level: a.level,
          language: a.language,
          completedAt: a.completedAt
        }));
      
      // Calculate breakdown by level
      const levelBreakdown = {};
      assessments.forEach(a => {
        if (!levelBreakdown[a.level]) {
          levelBreakdown[a.level] = {
            count: 0,
            totalScore: 0,
            averageScore: 0
          };
        }
        
        levelBreakdown[a.level].count += 1;
        levelBreakdown[a.level].totalScore += a.score;
      });
      
      // Calculate average scores by level
      Object.keys(levelBreakdown).forEach(level => {
        levelBreakdown[level].averageScore = 
          levelBreakdown[level].totalScore / levelBreakdown[level].count;
      });
      
      // Calculate breakdown by language
      const languageBreakdown = {};
      assessments.forEach(a => {
        if (!languageBreakdown[a.language]) {
          languageBreakdown[a.language] = {
            count: 0,
            totalScore: 0,
            averageScore: 0
          };
        }
        
        languageBreakdown[a.language].count += 1;
        languageBreakdown[a.language].totalScore += a.score;
      });
      
      // Calculate average scores by language
      Object.keys(languageBreakdown).forEach(language => {
        languageBreakdown[language].averageScore = 
          languageBreakdown[language].totalScore / languageBreakdown[language].count;
      });
      
      return {
        totalAssessments,
        averageScore,
        highestScore,
        recentScores,
        levelBreakdown,
        languageBreakdown
      };
    } catch (error) {
      console.error('Error getting user listening assessment statistics:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export default new ListeningAssessmentService(); 