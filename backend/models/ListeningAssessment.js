import mongoose from 'mongoose';

const listeningAssessmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
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
    enum: ['english', 'french']
  },
  score: {
    type: Number,
    required: true
  },
  correctAnswers: {
    type: Number,
    required: true
  },
  totalQuestions: {
    type: Number,
    required: true
  },
  answers: {
    type: [mongoose.Schema.Types.Mixed],
    default: []
  },
  // For multiple choice questions
  mcqAnswers: {
    type: Map,
    of: Number,
    default: {}
  },
  // For fill-in-the-blanks
  fillBlanksAnswers: {
    type: Map,
    of: String,
    default: {}
  },
  // For true/false tasks
  trueFalseAnswers: {
    type: Map,
    of: Boolean,
    default: {}
  },
  // For phrase matching tasks
  phraseMatchingAnswers: {
    type: Map,
    of: String,
    default: {}
  },
  feedback: {
    type: String
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
}, { timestamps: true });

// Add static method to check if a user can take an assessment
listeningAssessmentSchema.statics.canTakeAssessment = async function(userId, level, language) {
  try {
    // Find the most recent assessment for this user, level, and language
    const recentAssessment = await this.findOne({
      userId,
      level,
      language
    }).sort({ completedAt: -1 }).exec();
    
    // If no assessment found, user can take assessment
    if (!recentAssessment) {
      return {
        available: true,
        message: 'No previous assessment found. You can take this assessment now.',
        nextAvailableDate: null
      };
    }
    
    // Check if cooldown period has passed
    const now = new Date();
    const nextAvailableDate = recentAssessment.nextAvailableDate;
    
    if (now >= nextAvailableDate) {
      return {
        available: true,
        message: 'Cooldown period has passed. You can take this assessment now.',
        nextAvailableDate: null
      };
    }
    
    // User is still in cooldown period
    return {
      available: false,
      message: `You must wait until ${nextAvailableDate.toLocaleDateString()} before taking this assessment again.`,
      nextAvailableDate,
      previousScore: recentAssessment.score,
      previousAssessment: {
        completedAt: recentAssessment.completedAt,
        score: recentAssessment.score,
        feedback: recentAssessment.feedback
      }
    };
  } catch (error) {
    console.error('Error checking assessment availability:', error);
    throw error;
  }
};

// Indexes for efficient querying
listeningAssessmentSchema.index({ userId: 1, level: 1, language: 1 });
listeningAssessmentSchema.index({ userId: 1, completedAt: -1 });

const ListeningAssessment = mongoose.model('ListeningAssessment', listeningAssessmentSchema);

export default ListeningAssessment; 