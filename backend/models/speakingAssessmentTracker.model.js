import mongoose from 'mongoose';

const speakingAssessmentTrackerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    level: {
      type: String,
      required: true,
      enum: ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'],
    },
    language: {
      type: String,
      required: true,
      enum: ['english', 'french'],
    },
    prompt: {
      type: String,
      required: true,
    },
    videoUrl: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['submitted', 'evaluated', 'rejected'],
      default: 'submitted',
    },
    score: {
      type: Number,
      min: 0,
      max: 100,
    },
    feedback: {
      type: String,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    evaluatedAt: {
      type: Date,
    },
    evaluatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    criteria: [
      {
        name: {
          type: String,
          required: true,
        },
        score: {
          type: Number,
          required: true,
          min: 0,
          max: 20,
        },
        feedback: {
          type: String,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Create a compound index on userId and submittedAt to help with cooldown queries
speakingAssessmentTrackerSchema.index({ userId: 1, submittedAt: -1 });

// Add a method to check if a user is in a cooldown period
speakingAssessmentTrackerSchema.statics.isInCooldown = async function (
  userId,
  level,
  language
) {
  const cooldownDays = 7; // 7-day cooldown period
  const cooldownMs = cooldownDays * 24 * 60 * 60 * 1000;
  
  // Find the most recent assessment for this user with this level and language
  const latestAssessment = await this.findOne({
    userId,
    level,
    language,
  })
    .sort({ submittedAt: -1 })
    .exec();

  if (!latestAssessment) {
    return {
      inCooldown: false,
    };
  }

  const now = new Date();
  const submittedAt = new Date(latestAssessment.submittedAt);
  const cooldownEnd = new Date(submittedAt.getTime() + cooldownMs);
  
  // If now is before cooldownEnd, user is in cooldown period
  if (now < cooldownEnd) {
    return {
      inCooldown: true,
      assessment: latestAssessment,
      cooldownEnd,
      daysRemaining: Math.ceil((cooldownEnd - now) / (24 * 60 * 60 * 1000)),
    };
  }

  return {
    inCooldown: false,
    assessment: latestAssessment,
  };
};

const SpeakingAssessmentTracker = mongoose.model(
  'SpeakingAssessmentTracker',
  speakingAssessmentTrackerSchema
);

export default SpeakingAssessmentTracker; 