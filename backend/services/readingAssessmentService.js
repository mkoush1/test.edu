import ReadingAssessment from '../models/ReadingAssessment.js';

/**
 * Service for handling reading assessment data and operations
 */
class ReadingAssessmentService {
  /**
   * Submit a reading assessment
   * @param {Object} assessmentData - Assessment data
   * @param {String} userId - User ID
   * @returns {Promise<Object>} - Created assessment
   */
  async submitAssessment(assessmentData, userId) {
    try {
      // Create a new assessment with user data
      const newAssessment = new ReadingAssessment({
        user: userId,
        level: assessmentData.level,
        language: assessmentData.language,
        score: assessmentData.score,
        multipleChoiceAnswers: assessmentData.multipleChoiceAnswers || {},
        trueFalseAnswers: assessmentData.trueFalseAnswers || {},
        fillBlanksAnswers: assessmentData.fillBlanksAnswers || {},
        categorizationAnswers: assessmentData.categorizationAnswers || {},
        timeSpent: assessmentData.timeSpent || 0
      });
      
      // Save to database
      const savedAssessment = await newAssessment.save();
      
      return {
        success: true,
        assessment: savedAssessment
      };
    } catch (error) {
      console.error('Error submitting reading assessment:', error);
      throw error;
    }
  }
  
  /**
   * Check if a user can take a specific assessment
   * @param {String} userId - User ID
   * @param {String} level - CEFR level
   * @param {String} language - Language
   * @returns {Promise<Object>} - Availability data
   */
  async checkAssessmentAvailability(userId, level, language) {
    try {
      const availabilityData = await ReadingAssessment.canTakeAssessment(
        userId,
        level.toLowerCase(),
        language.toLowerCase()
      );
      
      return availabilityData;
    } catch (error) {
      console.error('Error checking reading assessment availability:', error);
      throw error;
    }
  }
  
  /**
   * Get a user's reading assessment history
   * @param {String} userId - User ID
   * @returns {Promise<Array>} - Assessment history
   */
  async getAssessmentHistory(userId) {
    try {
      const history = await ReadingAssessment.find(
        { user: userId },
        {
          level: 1,
          language: 1,
          score: 1,
          completedAt: 1,
          timeSpent: 1
        },
        { sort: { completedAt: -1 } }
      );
      
      return history;
    } catch (error) {
      console.error('Error fetching reading assessment history:', error);
      throw error;
    }
  }
  
  /**
   * Get statistics for reading assessments
   * @param {String} userId - User ID
   * @param {Object} filters - Optional filters like level, language
   * @returns {Promise<Object>} - Statistics data
   */
  async getStatistics(userId, filters = {}) {
    try {
      // Base query for the user
      const query = { user: userId };
      
      // Add optional filters
      if (filters.level) {
        query.level = filters.level.toLowerCase();
      }
      
      if (filters.language) {
        query.language = filters.language.toLowerCase();
      }
      
      // Get all matching assessments
      const assessments = await ReadingAssessment.find(
        query,
        {
          level: 1,
          language: 1,
          score: 1,
          completedAt: 1,
          timeSpent: 1
        },
        { sort: { completedAt: 1 } }
      );
      
      // Initialize result object
      const result = {
        totalAssessments: assessments.length,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 100,
        progressOverTime: [],
        byLevel: {},
        byLanguage: {}
      };
      
      // Calculate statistics
      if (assessments.length > 0) {
        // Calculate basic stats
        const totalScore = assessments.reduce((sum, a) => sum + a.score, 0);
        result.averageScore = totalScore / assessments.length;
        
        // Find highest and lowest scores
        result.highestScore = Math.max(...assessments.map(a => a.score));
        result.lowestScore = Math.min(...assessments.map(a => a.score));
        
        // Progress over time
        result.progressOverTime = assessments.map(a => ({
          date: a.completedAt,
          score: a.score,
          level: a.level.toUpperCase(),
          language: a.language
        }));
        
        // Group by level
        const levelGroups = assessments.reduce((groups, a) => {
          const level = a.level;
          if (!groups[level]) {
            groups[level] = [];
          }
          groups[level].push(a);
          return groups;
        }, {});
        
        // Calculate level stats
        Object.keys(levelGroups).forEach(level => {
          const levelAssessments = levelGroups[level];
          const levelTotalScore = levelAssessments.reduce((sum, a) => sum + a.score, 0);
          
          result.byLevel[level] = {
            count: levelAssessments.length,
            averageScore: levelTotalScore / levelAssessments.length,
            highestScore: Math.max(...levelAssessments.map(a => a.score)),
            lowestScore: Math.min(...levelAssessments.map(a => a.score)),
            latestScore: levelAssessments[levelAssessments.length - 1].score
          };
        });
        
        // Group by language
        const languageGroups = assessments.reduce((groups, a) => {
          const language = a.language;
          if (!groups[language]) {
            groups[language] = [];
          }
          groups[language].push(a);
          return groups;
        }, {});
        
        // Calculate language stats
        Object.keys(languageGroups).forEach(language => {
          const languageAssessments = languageGroups[language];
          const languageTotalScore = languageAssessments.reduce((sum, a) => sum + a.score, 0);
          
          result.byLanguage[language] = {
            count: languageAssessments.length,
            averageScore: languageTotalScore / languageAssessments.length,
            highestScore: Math.max(...languageAssessments.map(a => a.score)),
            lowestScore: Math.min(...languageAssessments.map(a => a.score)),
            latestScore: languageAssessments[languageAssessments.length - 1].score
          };
        });
      }
      
      return result;
    } catch (error) {
      console.error('Error getting reading assessment statistics:', error);
      throw error;
    }
  }
}

export default new ReadingAssessmentService(); 