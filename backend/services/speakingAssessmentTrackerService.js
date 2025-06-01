// speakingAssessmentTrackerService.js
import mongoose from 'mongoose';

// Define schema for speaking assessment records
const SpeakingAssessmentSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  userName: {
    type: String,
    default: null
  },
  userEmail: {
    type: String,
    default: null
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
  prompt: {
    type: String,
    default: "Speaking assessment task"
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
        console.log(`Found existing assessment for user ${assessmentData.userId}, updating...`);
        
        // Update existing assessment
        existingAssessment.videoUrl = assessmentData.videoUrl;
        existingAssessment.publicId = assessmentData.publicId;
        existingAssessment.score = assessmentData.score || existingAssessment.score;
        existingAssessment.feedback = assessmentData.feedback || existingAssessment.feedback;
        existingAssessment.transcribedText = assessmentData.transcribedText || existingAssessment.transcribedText;
        existingAssessment.status = assessmentData.status || existingAssessment.status;
        
        const updatedAssessment = await existingAssessment.save();
        console.log(`Successfully updated assessment: ${updatedAssessment._id}`);
        return updatedAssessment;
      } else {
        console.log(`No existing assessment found for user ${assessmentData.userId}, creating new...`);
        
        // Create new assessment record
        const assessment = new SpeakingAssessment(assessmentData);
        
        // Log assessment document before saving
        console.log('New assessment document:', {
          userId: assessment.userId,
          language: assessment.language,
          level: assessment.level,
          taskId: assessment.taskId,
          status: assessment.status
        });
        
        const savedAssessment = await assessment.save();
        console.log(`Successfully created new assessment: ${savedAssessment._id}`);
        return savedAssessment;
      }
    } catch (error) {
      console.error('Error saving assessment:', error);
      console.error('Error details:', {
        name: error.name,
        code: error.code,
        codeName: error.codeName,
        message: error.message,
        stack: error.stack
      });
      
      if (error.code === 11000) {
        console.error('Duplicate key error - assessment already exists with this userId/language/level/taskId combination');
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
      return await SpeakingAssessment.find({ userId }).sort({ createdAt: -1 });
    } catch (error) {
      console.error('Error getting user assessments:', error);
      throw error;
    }
  }

  /**
   * Get a specific assessment
   * @param {string} userId - User ID
   * @param {string} language - Language of assessment
   * @param {string} level - CEFR level
   * @param {number} taskId - Task ID
   * @returns {Promise<Object>} - Assessment record
   */
  async getAssessment(userId, language, level, taskId) {
    try {
      return await SpeakingAssessment.findOne({
        userId, language, level, taskId
      });
    } catch (error) {
      console.error('Error getting assessment:', error);
      throw error;
    }
  }

  /**
   * Get all pending assessments that need supervisor review
   * @returns {Promise<Array>} - Array of assessment records
   */
  async getPendingAssessments() {
    try {
      console.log('Fetching pending assessments from database');
      const pendingAssessments = await SpeakingAssessment.find({ status: 'pending' }).sort({ createdAt: -1 });
      
      console.log(`Found ${pendingAssessments.length} pending assessments`);
      
      // Log a sample of the first assessment for debugging if any exist
      if (pendingAssessments.length > 0) {
        const sampleAssessment = pendingAssessments[0];
        console.log('Sample pending assessment:', {
          id: sampleAssessment._id,
          userId: sampleAssessment.userId,
          videoUrl: sampleAssessment.videoUrl ? 'exists' : 'missing',
          status: sampleAssessment.status,
          createdAt: sampleAssessment.createdAt
        });
      }
      
      return pendingAssessments;
    } catch (error) {
      console.error('Error getting pending assessments:', error);
      console.error('Error details:', {
        name: error.name,
        code: error.code,
        message: error.message
      });
      throw error;
    }
  }

  /**
   * Submit supervisor evaluation for an assessment
   * @param {string} assessmentId - Assessment ID
   * @param {string} supervisorId - Supervisor ID
   * @param {number} score - Score assigned by supervisor
   * @param {string} feedback - Feedback provided by supervisor
   * @returns {Promise<Object>} - Updated assessment record
   */
  async submitSupervisorEvaluation(assessmentId, supervisorId, score, feedback) {
    try {
      console.log(`Submitting supervisor evaluation for assessment ${assessmentId}`, {
        supervisorId,
        score,
        feedbackLength: feedback?.length || 0
      });
      
      const assessment = await SpeakingAssessment.findById(assessmentId);
      
      if (!assessment) {
        console.error(`Assessment with ID ${assessmentId} not found`);
        throw new Error('Assessment not found');
      }
      
      // Update assessment with supervisor evaluation
      assessment.supervisorId = supervisorId;
      assessment.supervisorScore = score;
      assessment.supervisorFeedback = feedback;
      assessment.status = 'evaluated';
      assessment.evaluatedAt = new Date();
      
      // Log the update
      console.log('Updating assessment with:', {
        supervisorId,
        supervisorScore: score,
        supervisorFeedbackLength: feedback?.length || 0,
        status: 'evaluated',
        evaluatedAt: new Date()
      });
      
      const updatedAssessment = await assessment.save();
      console.log(`Successfully submitted evaluation for assessment ${updatedAssessment._id}`);
      
      return updatedAssessment;
    } catch (error) {
      console.error('Error submitting evaluation:', error);
      console.error('Error details:', {
        name: error.name,
        code: error.code,
        message: error.message
      });
      throw error;
    }
  }

  /**
   * Get a specific assessment by ID
   * @param {string} assessmentId - Assessment ID
   * @returns {Promise<Object>} - Assessment record
   */
  async getAssessmentById(assessmentId) {
    try {
      return await SpeakingAssessment.findById(assessmentId);
    } catch (error) {
      console.error('Error getting assessment by ID:', error);
      throw error;
    }
  }

  /**
   * Update an assessment by ID
   * @param {string} assessmentId - Assessment ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} - Updated assessment record
   */
  async updateAssessment(assessmentId, updateData) {
    try {
      console.log(`Updating assessment ${assessmentId} with data:`, {
        ...updateData,
        supervisorFeedback: updateData.supervisorFeedback ? 
          `${updateData.supervisorFeedback.substring(0, 50)}...` : undefined
      });
      
      const assessment = await SpeakingAssessment.findById(assessmentId);
      
      if (!assessment) {
        console.error(`Assessment with ID ${assessmentId} not found`);
        return null;
      }
      
      // Update fields
      Object.keys(updateData).forEach(key => {
        assessment[key] = updateData[key];
      });
      
      const updatedAssessment = await assessment.save();
      console.log(`Successfully updated assessment ${updatedAssessment._id}`);
      
      return updatedAssessment;
    } catch (error) {
      console.error('Error updating assessment:', error);
      console.error('Error details:', {
        name: error.name,
        code: error.code,
        message: error.message
      });
      throw error;
    }
  }
}

export default new SpeakingAssessmentTrackerService(); 