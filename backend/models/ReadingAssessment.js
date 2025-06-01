import mongoose from 'mongoose';
const Schema = mongoose.Schema;

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
  }
}, {
  timestamps: true
});

// Index for quick lookup by user and assessment type
ReadingAssessmentSchema.index({ user: 1, level: 1, language: 1 });

// Static method to check if a user can take a specific assessment
ReadingAssessmentSchema.statics.canTakeAssessment = async function(userId, level, language) {
  const cooldownPeriod = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
  
  const lastAssessment = await this.findOne(
    { user: userId, level, language },
    { completedAt: 1, score: 1 },
    { sort: { completedAt: -1 } }
  );
  
  if (!lastAssessment) {
    return {
      available: true
    };
  }
  
  const now = new Date();
  const lastCompletedAt = new Date(lastAssessment.completedAt);
  const timeSinceLastAssessment = now - lastCompletedAt;
  
  // Check if cooldown period has passed
  if (timeSinceLastAssessment < cooldownPeriod) {
    const nextAvailableDate = new Date(lastCompletedAt.getTime() + cooldownPeriod);
    return {
      available: false,
      nextAvailableDate,
      previousAssessment: lastAssessment,
      previousScore: lastAssessment.score
    };
  }
  
  return {
    available: true,
    previousAssessment: lastAssessment,
    previousScore: lastAssessment.score
  };
};

export default mongoose.model('ReadingAssessment', ReadingAssessmentSchema); 