// update-assessments.js
import mongoose from 'mongoose';

// Hardcoded MongoDB URI
const MONGODB_URI = 'mongodb+srv://edusoft:RALPBedvxKVF0El7@edusoft-cluster.way6fkv.mongodb.net/edusoft?retryWrites=true&w=majority&appName=EduSoft-Cluster';

// Define the same schema for SpeakingAssessment
const SpeakingAssessmentSchema = new mongoose.Schema({
  userId: String,
  language: String,
  level: String,
  taskId: Number,
  videoUrl: String,
  publicId: String,
  score: Number,
  feedback: String,
  transcribedText: String,
  status: {
    type: String,
    enum: ['pending', 'evaluated', 'rejected'],
    default: 'pending'
  },
  supervisorId: String,
  supervisorFeedback: String,
  supervisorScore: Number,
  evaluatedAt: Date,
  createdAt: Date,
  updatedAt: Date
});

async function updateAssessments() {
  try {
    console.log('Connecting to MongoDB...');
    
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to MongoDB');
    
    // Create the model
    const SpeakingAssessment = mongoose.model('SpeakingAssessment', SpeakingAssessmentSchema);
    
    // Find all assessments without a status field or with a null status
    const assessments = await SpeakingAssessment.find({
      $or: [
        { status: { $exists: false } },
        { status: null }
      ]
    });
    
    console.log(`Found ${assessments.length} assessments without a status field`);
    
    // Update all found assessments to have a status of "pending"
    if (assessments.length > 0) {
      const result = await SpeakingAssessment.updateMany(
        {
          $or: [
            { status: { $exists: false } },
            { status: null }
          ]
        },
        {
          $set: { status: 'pending' }
        }
      );
      
      console.log(`Updated ${result.modifiedCount} assessments to have a status of "pending"`);
    }
    
    // Verify the updates
    const pendingCount = await SpeakingAssessment.countDocuments({ status: 'pending' });
    console.log(`Total assessments with status "pending": ${pendingCount}`);
    
    // List all assessments with their status
    const allAssessments = await SpeakingAssessment.find({}, 'userId language level taskId status');
    console.log('All assessments:');
    console.log(JSON.stringify(allAssessments, null, 2));
    
    console.log('Update completed successfully');
    mongoose.disconnect();
  } catch (error) {
    console.error('Error updating assessments:', error);
    process.exit(1);
  }
}

updateAssessments().then(() => {
  console.log('Script completed');
  process.exit(0);
}).catch(err => {
  console.error('Script failed:', err);
  process.exit(1);
}); 