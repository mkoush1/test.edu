import mongoose from 'mongoose';
const Schema = mongoose.Schema;

/**
 * Schema for reading assessment
 */
const ReadingAssessmentSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  level: {
    type: String,
    required: true,
    enum: ['a1', 'a2', 'b1', 'b2', 'c1', 'c2']
  },
  language: {
    type: String,
    required: true,
    default: 'english'
  },
  score: {
    type: Number,
    required: true
  },
  multipleChoiceAnswers: {
    type: Object,
    default: {}
  },
  trueFalseAnswers: {
    type: Object,
    default: {}
  },
  fillBlanksAnswers: {
    type: Object,
    default: {}
  },
  categorizationAnswers: {
    type: Object,
    default: {}
  },
  timeSpent: {
    type: Number,
    default: 0
  },
  completedAt: {
    type: Date,
    default: Date.now
  },
  nextAvailableDate: {
    type: Date,
    default: function() {
      // Set next available date to 7 days after completion
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + 7);
      return nextDate;
    }
  }
}, {
  timestamps: true
});

// Create index for efficient querying
ReadingAssessmentSchema.index({ user: 1, level: 1, language: 1 });

// Static method that can be called without creating an instance
ReadingAssessmentSchema.statics.canTakeAssessment = async function(userId, level, language) {
  try {
    // Find the most recent assessment for this user, level, and language
    const lastAssessment = await this.findOne(
      { 
        user: userId, 
        level: level.toLowerCase(), 
        language: language.toLowerCase() 
      },
      { completedAt: 1, score: 1, nextAvailableDate: 1 },
      { sort: { completedAt: -1 } }
    );
    
    // If no previous assessment found, user can take this assessment
    if (!lastAssessment) {
      return {
        available: true,
        message: 'No previous assessment found. You can take this assessment now.'
      };
    }
    
    // Check if cooldown period has passed
    const now = new Date();
    const nextAvailableDate = new Date(lastAssessment.nextAvailableDate);
    
    if (now >= nextAvailableDate) {
      return {
        available: true,
        message: 'Cooldown period has passed. You can take this assessment now.',
        previousAssessment: lastAssessment,
        previousScore: lastAssessment.score
      };
    }
    
    // User is still in cooldown period
    return {
      available: false,
      message: 'You must wait before taking this assessment again.',
      nextAvailableDate,
      previousAssessment: {
        completedAt: lastAssessment.completedAt,
        score: lastAssessment.score
      },
      previousScore: lastAssessment.score
    };
  } catch (error) {
    console.error('Error in canTakeAssessment:', error);
    // Default to allowing assessment if there's an error
    return { available: true };
  }
};

// Create and export the model
const ReadingAssessment = mongoose.model('ReadingAssessment', ReadingAssessmentSchema);
export default ReadingAssessment; 