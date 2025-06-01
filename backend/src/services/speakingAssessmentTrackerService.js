// speakingAssessmentTrackerService.js
import mongoose from 'mongoose';

// Define schema for speaking assessment records
const SpeakingAssessmentSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  language: {
    type: String,
    required: true
  },
  level: {
    type: String,
    required: true
  },
  taskId: {
    type: Number,
    required: true
  },
  videoUrl: {
    type: String,
    required: true
  },
  publicId: {
    type: String,
    required: true
  },
  score: {
    type: Number,
    default: 0
  },
  feedback: {
    type: String
  },
  transcribedText: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'evaluated', 'rejected'],
    default: 'pending',
    index: true // Add index for faster queries
  },
  supervisorId: {
    type: String,
    default: null
  },
  supervisorFeedback: {
    type: String,
    default: null
  },
  supervisorScore: {
    type: Number,
    default: null
  },
  evaluatedAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  nextAvailableDate: {
    type: Date,
    default: function() {
      // Set next available date to 7 days after creation
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + 7);
      return nextDate;
    }
  }
}, {
  timestamps: true
});

// Create a compound index to ensure one assessment per level per user
SpeakingAssessmentSchema.index({ userId: 1, language: 1, level: 1, taskId: 1 }, { unique: true });

// Create model - check if it already exists first to avoid model overwrite errors
const SpeakingAssessment = mongoose.models.SpeakingAssessment || 
  mongoose.model('SpeakingAssessment', SpeakingAssessmentSchema);

// Ensure the model is properly created
console.log('SpeakingAssessment model initialized');

// Test that the model is working by logging the collection name
console.log('SpeakingAssessment collection name:', SpeakingAssessment.collection.name);

/**
 * Service for tracking speaking assessments
 */
class SpeakingAssessmentTrackerService {
  /**
   * Check if a user has already completed a speaking assessment for a level and task
   * @param {string} userId - User ID
   * @param {string} language - Language of assessment
   * @param {string} level - CEFR level
   * @param {number} taskId - Task ID
   * @returns {Promise<boolean>} - True if user has already completed assessment
   */
  async hasCompletedAssessment(userId, language, level, taskId) {
    try {
      const assessment = await SpeakingAssessment.findOne({
        userId, language, level, taskId
      });
      return !!assessment;
    } catch (error) {
      console.error('Error checking assessment completion:', error);
      throw error;
    }
  }

  /**
   * Check if a user can take an assessment (based on cooldown period)
   * @param {string} userId - User ID
   * @param {string} language - Language of assessment
   * @param {string} level - CEFR level
   * @param {number} taskId - Task ID
   * @returns {Promise<Object>} - Object with available flag and next available date
   */
  async canTakeAssessment(userId, language, level, taskId) {
    try {
      // Find the most recent assessment for this user/language/level/task
      const assessment = await SpeakingAssessment.findOne({
        userId, language, level, taskId
      });
      
      // If no previous assessment exists, user can take it
      if (!assessment) {
        return { available: true };
      }
      
      // Check if it's been evaluated
      if (assessment.status === 'evaluated' && assessment.evaluatedAt) {
        // Check if cooldown period (7 days) has passed
        const now = new Date();
        const cooldownDays = 7;
        
        // Calculate next available date
        const nextAvailableDate = assessment.nextAvailableDate || 
          new Date(assessment.evaluatedAt.getTime() + (cooldownDays * 24 * 60 * 60 * 1000));
        
        if (now < nextAvailableDate) {
          // User must wait
          return {
            available: false,
            nextAvailableDate: nextAvailableDate
          };
        }
      }
      
      // For pending assessments, user can't take a new one until this one is evaluated
      if (assessment.status === 'pending') {
        return {
          available: false,
          pendingReview: true,
          assessmentId: assessment._id
        };
      }
      
      // Otherwise, user can take the assessment
      return { available: true };
    } catch (error) {
      console.error('Error checking if user can take assessment:', error);
      // Default to allowing assessment if error occurs
      return { available: true };
    }
  }

  /**
   * Record a completed speaking assessment
   * @param {Object} assessmentData - Assessment data
   * @returns {Promise<Object>} - Saved assessment record
   */
  async saveAssessment(assessmentData) {
    try {
      console.log('Attempting to save speaking assessment with data:', {
        userId: assessmentData.userId,
        language: assessmentData.language,
        level: assessmentData.level,
        taskId: assessmentData.taskId,
        hasVideoUrl: !!assessmentData.videoUrl,
        hasPublicId: !!assessmentData.publicId,
        hasScore: !!assessmentData.score,
        hasFeedback: !!assessmentData.feedback,
        hasTranscribedText: !!assessmentData.transcribedText
      });
      
      // Check if an assessment already exists
      const existingAssessment = await SpeakingAssessment.findOne({
        userId: assessmentData.userId,
        language: assessmentData.language,
        level: assessmentData.level,
        taskId: assessmentData.taskId
      }).exec(); // Add .exec() to ensure proper promise handling
      
      if (existingAssessment) {
        console.log('Found existing assessment, updating with new data');
        
        // Update the existing assessment
        existingAssessment.videoUrl = assessmentData.videoUrl || existingAssessment.videoUrl;
        existingAssessment.publicId = assessmentData.publicId || existingAssessment.publicId;
        existingAssessment.score = assessmentData.score || existingAssessment.score;
        existingAssessment.feedback = assessmentData.feedback || existingAssessment.feedback;
        existingAssessment.transcribedText = assessmentData.transcribedText || existingAssessment.transcribedText;
        existingAssessment.status = assessmentData.status || existingAssessment.status;
        
        // Save the updated assessment
        await existingAssessment.save();
        
        console.log('Successfully updated existing assessment');
        return existingAssessment;
      }
      
      // Create a new assessment
      console.log('No existing assessment found, creating new one');
      const assessment = new SpeakingAssessment({
        userId: assessmentData.userId,
        language: assessmentData.language,
        level: assessmentData.level,
        taskId: assessmentData.taskId,
        videoUrl: assessmentData.videoUrl,
        publicId: assessmentData.publicId,
        score: assessmentData.score,
        feedback: assessmentData.feedback,
        transcribedText: assessmentData.transcribedText,
        status: assessmentData.status || 'pending',
      });
      
      // Save the assessment
      await assessment.save();
      
      console.log('Successfully saved new assessment');
      return assessment;
    } catch (error) {
      console.error('Error saving speaking assessment:', error);
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
      const assessments = await SpeakingAssessment.find({ userId })
        .sort({ createdAt: -1 })
        .exec();
      
      return assessments;
    } catch (error) {
      console.error('Error getting user assessments:', error);
      throw error;
    }
  }

  /**
   * Get a specific assessment for a user, language, level, and task
   * @param {string} userId - User ID
   * @param {string} language - Language of assessment
   * @param {string} level - CEFR level
   * @param {number} taskId - Task ID
   * @returns {Promise<Object>} - Assessment record
   */
  async getAssessment(userId, language, level, taskId) {
    try {
      // Find the assessment
      const assessment = await SpeakingAssessment.findOne({
        userId, language, level, taskId
      }).exec();
      
      return assessment;
    } catch (error) {
      console.error('Error getting assessment:', error);
      throw error;
    }
  }

  /**
   * Get all pending assessments (for supervisor review)
   * @returns {Promise<Array>} - Array of pending assessment records
   */
  async getPendingAssessments() {
    try {
      // Get all assessments with pending status
      const pendingAssessments = await SpeakingAssessment.find({
        status: 'pending'
      })
        .sort({ createdAt: -1 }) // Newest first
        .limit(50) // Limit to 50 most recent
        .exec();
      
      return pendingAssessments;
    } catch (error) {
      console.error('Error getting pending assessments:', error);
      throw error;
    }
  }

  /**
   * Get the last assessment for a user in a specific language and level
   * @param {string} userId - User ID
   * @param {string} language - Language of assessment
   * @param {string} level - CEFR level
   * @returns {Promise<Object>} - Last assessment record
   */
  async getLastAssessment(userId, language, level) {
    try {
      // Find the most recent assessment for this user/language/level
      const assessment = await SpeakingAssessment.findOne({
        userId, language, level
      })
        .sort({ createdAt: -1 })
        .exec();
      
      return assessment;
    } catch (error) {
      console.error('Error getting last assessment:', error);
      throw error;
    }
  }

  /**
   * Submit supervisor evaluation for an assessment
   * @param {string} assessmentId - Assessment ID
   * @param {string} supervisorId - Supervisor ID
   * @param {number} score - Supervisor score
   * @param {string} feedback - Supervisor feedback
   * @returns {Promise<Object>} - Updated assessment record
   */
  async submitSupervisorEvaluation(assessmentId, supervisorId, score, feedback) {
    try {
      // Find the assessment
      const assessment = await SpeakingAssessment.findById(assessmentId).exec();
      
      if (!assessment) {
        throw new Error('Assessment not found');
      }
      
      // Update the assessment
      assessment.supervisorId = supervisorId;
      assessment.supervisorScore = score;
      assessment.supervisorFeedback = feedback;
      assessment.status = 'evaluated';
      assessment.evaluatedAt = new Date();
      
      // Calculate next available date
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + 7); // 7 days from now
      assessment.nextAvailableDate = nextDate;
      
      // Save the updated assessment
      await assessment.save();
      
      return assessment;
    } catch (error) {
      console.error('Error submitting supervisor evaluation:', error);
      throw error;
    }
  }

  /**
   * Update an assessment
   * @param {string} assessmentId - Assessment ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} - Updated assessment record
   */
  async updateAssessment(assessmentId, updateData) {
    try {
      // Find the assessment and update it
      const assessment = await SpeakingAssessment.findByIdAndUpdate(
        assessmentId,
        { $set: updateData },
        { new: true, runValidators: true }
      ).exec();
      
      if (!assessment) {
        throw new Error('Assessment not found');
      }
      
      return assessment;
    } catch (error) {
      console.error('Error updating assessment:', error);
      throw error;
    }
  }

  /**
   * Get an assessment by ID
   * @param {string} assessmentId - Assessment ID
   * @returns {Promise<Object>} - Assessment record
   */
  async getAssessmentById(assessmentId) {
    try {
      // Find the assessment
      const assessment = await SpeakingAssessment.findById(assessmentId).exec();
      
      if (!assessment) {
        throw new Error('Assessment not found');
      }
      
      return assessment;
    } catch (error) {
      console.error('Error getting assessment by ID:', error);
      throw error;
    }
  }
}

export default new SpeakingAssessmentTrackerService(); 