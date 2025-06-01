// test-db-connection.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import SpeakingAssessmentTrackerService from './services/speakingAssessmentTrackerService.js';

// Load environment variables
dotenv.config();

// Function to test the database connection
async function testDbConnection() {
  try {
    console.log('Testing MongoDB connection...');
    
    // Get the MongoDB URI from environment variables
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      console.error('MongoDB URI not found in environment variables');
      process.exit(1);
    }
    
    console.log('MongoDB URI found in environment variables');
    
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    
    console.log('MongoDB connection successful!');
    console.log('Connection state:', mongoose.connection.readyState);
    console.log('Database name:', mongoose.connection.db.databaseName);
    
    // List collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
    
    // Test speaking assessment insertion
    console.log('\nTesting speaking assessment insertion...');
    
    // Create test assessment data
    const testAssessment = {
      userId: `test_user_${Date.now()}`,
      language: 'english',
      level: 'b1',
      taskId: 1,
      videoUrl: 'https://test-video-url.com/test.mp4',
      publicId: `test_public_id_${Date.now()}`,
      score: 75,
      feedback: JSON.stringify({
        criteria: [
          { name: 'Fluency', score: 7, maxScore: 9 }
        ],
        overallScore: 75,
        feedback: 'Test feedback',
        recommendations: ['Practice more']
      }),
      transcribedText: 'Test transcription',
      status: 'pending'
    };
    
    // Insert test assessment
    try {
      const savedAssessment = await SpeakingAssessmentTrackerService.saveAssessment(testAssessment);
      console.log('Test assessment saved successfully with ID:', savedAssessment._id);
      
      // Verify we can retrieve it
      const retrievedAssessment = await SpeakingAssessmentTrackerService.getAssessment(
        testAssessment.userId,
        testAssessment.language,
        testAssessment.level,
        testAssessment.taskId
      );
      
      if (retrievedAssessment) {
        console.log('Successfully retrieved the test assessment');
        console.log('Assessment status:', retrievedAssessment.status);
      } else {
        console.error('Failed to retrieve the test assessment');
      }
    } catch (error) {
      console.error('Error saving test assessment:', error);
      console.error('Error details:', {
        name: error.name,
        code: error.code,
        message: error.message
      });
    }
    
    console.log('\nDatabase test complete');
    
  } catch (error) {
    console.error('Database connection test failed:', error);
  } finally {
    // Close the connection
    if (mongoose.connection.readyState) {
      await mongoose.connection.close();
      console.log('MongoDB connection closed');
    }
  }
}

// Run the test
testDbConnection(); 