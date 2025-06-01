import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import fileUpload from 'express-fileupload';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import assessmentRoutes from './routes/assessmentRoutes.js';
import puzzleRoutes from './routes/puzzleRoutes.js';
import presentationAssessmentRoutes from './routes/presentationAssessment.routes.js';
import speakingQuestionRoutes from './routes/speakingQuestionRoutes.js';
import writingAssessmentRoutes from './routes/writingAssessmentRoutes.js';
import speakingAssessmentRoutes from './routes/speakingAssessmentRoutes.js';
import listeningAssessmentRoutes from './routes/listeningAssessmentRoutes.js';
import cloudinaryRoutes from './routes/cloudinaryRoutes.js';
import readingAssessmentRoutes from './routes/readingAssessmentRoutes.js';
import communicationRoutes from './routes/communicationRoutes.js';

// Load environment variables
dotenv.config();

// Verify MongoDB URI
console.log('MongoDB URI:', process.env.MONGODB_URI ? 'Found' : 'Not Found');

const app = express();

// Middleware
app.use(express.json({ limit: '50mb' }));  // Increased limit for larger video submissions

// File upload middleware
app.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max file size
  useTempFiles: true,
  tempFileDir: '/tmp/',
  debug: true // Enable debug mode for troubleshooting
}));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  next();
});

// CORS configuration
const corsOptions = {
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
};

app.use(cors(corsOptions));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/puzzle', puzzleRoutes);
app.use('/api/assessments/presentation', presentationAssessmentRoutes);
app.use('/api/speaking-questions', speakingQuestionRoutes);
app.use('/api/writing-assessment', writingAssessmentRoutes);
app.use('/api/speaking-assessment', speakingAssessmentRoutes);
app.use('/api/listening-assessment', listeningAssessmentRoutes);
app.use('/api/reading-assessment', readingAssessmentRoutes);
app.use('/api/cloudinary', cloudinaryRoutes);
app.use('/api/communication', communicationRoutes);

// Connect to MongoDB
const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.warn('MongoDB URI is not defined in environment variables');
      // For development, provide a default MongoDB URI
      process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/edusoft';
      console.log('Using default MongoDB URI for development');
    }

    console.log('Attempting to connect to MongoDB...');
    console.log('Using URI:', process.env.MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')); // Hide credentials in logs

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database Name: ${conn.connection.name}`);

    // Verify connection by listing collections
    const collections = await conn.connection.db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    console.error('Error details:', {
      name: error.name,
      code: error.code,
      codeName: error.codeName,
      stack: error.stack
    });
    // Don't exit on connection error in development
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    } else {
      console.log('Continuing without database connection in development mode');
    }
  }
};

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

// Initialize database connection
connectDB();

// Start server
const PORT = 5003; // Force port 5003
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Test the API at: http://localhost:${PORT}/api/test`);
  console.log(`Writing assessment endpoint: http://localhost:${PORT}/api/writing-assessment/evaluate`);
  console.log(`Speaking assessment endpoint: http://localhost:${PORT}/api/speaking-assessment/evaluate`);
  console.log(`Speaking assessment review endpoint: http://localhost:${PORT}/api/speaking-assessment/pending`);
  console.log(`Reading assessment endpoint: http://localhost:${PORT}/api/reading-assessment/submit`);
}); 