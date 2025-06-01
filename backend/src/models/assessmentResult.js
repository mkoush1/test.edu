import mongoose from 'mongoose';

const assessmentResultSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assessmentType: {
    type: String,
    required: true,
    enum: ['leadership', 'puzzle-game', 'fast-questions', 'codeforces', 'adaptability', 'communication', 'writing', 'speaking', 'reading', 'listening'],
  },
  completedAt: {
    type: Date,
    default: Date.now
  },
  score: {
    type: Number,
    required: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { strict: false });

// Index for efficient querying
assessmentResultSchema.index({ userId: 1, assessmentType: 1 });

const AssessmentResult = mongoose.models.AssessmentResult || mongoose.model('AssessmentResult', assessmentResultSchema);

export default AssessmentResult; 