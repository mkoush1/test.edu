// writingAssessmentTrackerService.js
import mongoose from 'mongoose';
import WritingAssessment from '../models/WritingAssessment.js';

/**
 * Service for tracking and managing writing assessments
 */
class WritingAssessmentTrackerService {
  /**
   * Check if a user has completed an assessment
   * @param {string} userId - User ID
   * @param {string} language - Language of assessment
   * @param {string} level - CEFR level
   * @returns {Promise<boolean>} - True if completed, false otherwise
   */
  async hasCompletedAssessment(userId, language, level) {
    try {
      // Find any completed assessment for this user/language/level
      const assessment = await WritingAssessment.findOne({
        userId, language, level
      }).exec();
      
      return !!assessment;
    } catch (error) {
      console.error('Error checking writing assessment completion:', error);
      throw error;
    }
  }

  /**
   * Check if a user can take an assessment (based on cooldown period)
   * @param {string} userId - User ID
   * @param {string} language - Language of assessment
   * @param {string} level - CEFR level
   * @returns {Promise<Object>} - Object with available flag and next available date
   */
  async canTakeAssessment(userId, language, level) {
    try {
      // Find the most recent assessment for this user/language/level
      const assessment = await WritingAssessment.findOne({
        userId, language, level
      }).sort({ completedAt: -1 }).exec();
      
      // If no previous assessment exists, user can take it
      if (!assessment) {
        return { available: true };
      }
      
      // Check if cooldown period (7 days) has passed
      const now = new Date();
      const cooldownDays = 7;
      
      // Calculate next available date
      const nextAvailableDate = assessment.nextAvailableDate || 
        new Date(assessment.completedAt.getTime() + (cooldownDays * 24 * 60 * 60 * 1000));
      
      if (now < nextAvailableDate) {
        // User must wait
        return {
          available: false,
          nextAvailableDate: nextAvailableDate,
          lastAssessment: {
            completedAt: assessment.completedAt,
            score: assessment.score,
            prompt: assessment.prompt,
            response: assessment.response,
            feedback: assessment.feedback,
            criteria: assessment.criteria
          }
        };
      }
      
      // Otherwise, user can take the assessment
      return { available: true };
    } catch (error) {
      console.error('Error checking if user can take writing assessment:', error);
      // Default to allowing assessment if error occurs
      return { available: true };
    }
  }

  /**
   * Save a writing assessment result
   * @param {Object} assessmentData - Assessment data
   * @returns {Promise<Object>} - Saved assessment record
   */
  async saveAssessment(assessmentData) {
    try {
      console.log('Attempting to save writing assessment with data:', {
        userId: assessmentData.userId,
        language: assessmentData.language,
        level: assessmentData.level,
        promptLength: assessmentData.prompt?.length,
        responseLength: assessmentData.response?.length,
        score: assessmentData.score,
        criteriaCount: assessmentData.criteria?.length
      });
      
      // Create the next available date (7 days from now)
      const nextAvailableDate = new Date();
      nextAvailableDate.setDate(nextAvailableDate.getDate() + 7);
      
      // Create a new assessment
      const assessment = new WritingAssessment({
        userId: assessmentData.userId,
        language: assessmentData.language,
        level: assessmentData.level,
        prompt: assessmentData.prompt,
        response: assessmentData.response,
        score: assessmentData.score,
        feedback: assessmentData.feedback,
        criteria: assessmentData.criteria,
        completedAt: new Date(),
        nextAvailableDate: nextAvailableDate
      });
      
      // Save the assessment
      await assessment.save();
      
      console.log('Successfully saved writing assessment');
      return assessment;
    } catch (error) {
      console.error('Error saving writing assessment:', error);
      // Log additional MongoDB connection info for debugging
      console.error('MongoDB connection state:', mongoose.connection.readyState);
      
      // Detailed error logging
      if (error.name === 'ValidationError') {
        for (let field in error.errors) {
          console.error(`Validation error for field ${field}:`, error.errors[field].message);
        }
      }
      
      throw error;
    }
  }

  /**
   * Get all assessments for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - Array of assessment records
   */
  async getUserAssessments(userId) {
    try {
      // Validate userId
      if (!userId) {
        throw new Error('User ID is required');
      }
      
      // Find all assessments for the user, sorted by creation date (newest first)
      const assessments = await WritingAssessment.find({ userId })
        .sort({ completedAt: -1 })
        .exec();
      
      return assessments;
    } catch (error) {
      console.error('Error getting user writing assessments:', error);
      throw error;
    }
  }

  /**
   * Get the last assessment for a user by language and level
   * @param {string} userId - User ID
   * @param {string} language - Language of assessment
   * @param {string} level - CEFR level
   * @returns {Promise<Object>} - Assessment record
   */
  async getLastAssessment(userId, language, level) {
    try {
      // Find the most recent assessment
      const assessment = await WritingAssessment.findOne({
        userId, language, level
      })
      .sort({ completedAt: -1 })
      .exec();
      
      return assessment;
    } catch (error) {
      console.error('Error getting last writing assessment:', error);
      throw error;
    }
  }
}

export default new WritingAssessmentTrackerService(); 