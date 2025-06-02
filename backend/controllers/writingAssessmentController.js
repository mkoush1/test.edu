// writingAssessmentController.js
import writingAssessmentService from '../services/writingAssessmentService.js';
import WritingAssessment from '../models/WritingAssessment.js';
import mongoose from 'mongoose';

/**
 * Controller for writing assessment endpoints
 */
class WritingAssessmentController {
  constructor() {
    // Bind instance methods to this context
    this.evaluateWriting = this.evaluateWriting.bind(this);
    this.submitWritingAssessment = this.submitWritingAssessment.bind(this);
    this.checkAssessmentAvailability = this.checkAssessmentAvailability.bind(this);
    this.getUserWritingAssessments = this.getUserWritingAssessments.bind(this);
    this.checkWritingAssessmentAvailability = this.checkWritingAssessmentAvailability.bind(this);
    this.getWritingAssessmentById = this.getWritingAssessmentById.bind(this);
    this.generatePrompt = this.generatePrompt.bind(this);
    
    // Simple cache for generated prompts to prevent duplicate API calls
    this.promptCache = new Map();
    this.cacheTTL = 5 * 60 * 1000; // 5 minutes cache TTL
    
    // Track ongoing requests to prevent duplicates
    this.pendingRequests = new Map();
  }

  /**
   * Evaluate a writing submission
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async evaluateWriting(req, res) {
    console.log('WritingAssessmentController.evaluateWriting called');
    try {
      const { question, answer } = req.body;
      
      console.log('Request body received:', {
        hasQuestion: !!question,
        questionLength: question?.length || 0,
        hasAnswer: !!answer,
        answerLength: answer?.length || 0
      });
      
      // Validate request
      if (!question || !answer) {
        console.log('Validation failed: Missing question or answer');
        return res.status(400).json({
          success: false,
          message: 'Question and answer are required'
        });
      }
      
      console.log('Validation passed, calling writingAssessmentService.evaluateWriting');
      
      // Call the service to evaluate
      const assessment = await writingAssessmentService.evaluateWriting(question, answer);
      
      console.log('Assessment received from service:', {
        hasAssessment: !!assessment,
        criteriaCount: assessment?.criteria?.length || 0,
        overallScore: assessment?.overallScore
      });
      
      // Return the assessment results
      console.log('Sending successful response to client');
      return res.status(200).json({
        success: true,
        assessment
      });
    } catch (error) {
      console.error('Error in evaluateWriting controller:', {
        message: error.message,
        stack: error.stack
      });
      return res.status(500).json({
        success: false,
        message: 'Failed to evaluate writing',
        error: error.message
      });
    }
  }

  /**
   * Submit a writing assessment to the database
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async submitWritingAssessment(req, res) {
    try {
      const { type, level, language, score, tasks, feedback } = req.body;
      
      // Get user ID from the authenticated user
      const userId = req.user?._id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }
      
      // Check if user is allowed to take this assessment (not in cooldown period)
      const canTakeAssessment = await this.checkAssessmentAvailability(userId, level, language);
      
      if (!canTakeAssessment.available) {
        return res.status(403).json({
          success: false,
          message: 'You must wait 7 days between assessment attempts',
          nextAvailableDate: canTakeAssessment.nextAvailableDate
        });
      }
      
      // Get the task and response
      const task = tasks[0];
      
      if (!task || !task.response) {
        return res.status(400).json({
          success: false,
          message: 'Task and response are required'
        });
      }
      
      // Prepare criteria array from task metrics or AI evaluation
      let criteria = [];
      
      // First, extract criteria properly to ensure consistency
      if (task.aiEvaluation && task.aiEvaluation.criteria) {
        criteria = task.aiEvaluation.criteria.map(criterion => ({
          name: criterion.name,
          score: criterion.score,
          feedback: criterion.feedback
        }));
      } else if (task.metrics) {
        criteria = task.metrics.map(metric => ({
          name: metric.name,
          score: metric.score,
          feedback: metric.comment || metric.feedback
        }));
      }
      
      // Calculate the score consistently based on criteria
      // Each criterion is out of 10, so total is out of 50, convert to percentage
      const totalPoints = criteria.reduce((sum, criterion) => sum + criterion.score, 0);
      const calculatedScore = Math.round((totalPoints / 50) * 100);
      
      // Log any discrepancy for debugging
      if (score !== calculatedScore) {
        console.log(`Score discrepancy detected in submission: Provided score ${score}%, calculated score ${calculatedScore}%`);
      }
      
      // Always use the calculated score for consistency
      const finalScore = calculatedScore;
      console.log(`Using calculated score for consistency: ${finalScore}%`);
      
      // Create a new assessment record
      const writingAssessment = new WritingAssessment({
        userId: userId,
        level: level,
        language: language,
        prompt: task.prompt,
        response: task.response,
        score: finalScore, // Use the consistent score
        feedback: feedback,
        criteria: criteria,
        completedAt: new Date(),
        nextAvailableDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
      });
      
      // Save to database
      await writingAssessment.save();
      
      // Return both scores to help with debugging
      return res.status(201).json({
        success: true,
        message: 'Writing assessment submitted successfully',
        result: {
          ...writingAssessment.toObject(),
          providedScore: score,
          calculatedScore: finalScore
        }
      });
    } catch (error) {
      console.error('Error in submitWritingAssessment controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to submit writing assessment',
        error: error.message
      });
    }
  }

  /**
   * Check if user can take an assessment (not in cooldown period)
   * @param {string} userId - User ID
   * @param {string} level - Assessment level
   * @param {string} language - Assessment language
   * @returns {Object} - Availability status and next available date
   */
  async checkAssessmentAvailability(userId, level, language) {
    try {
      // Find most recent assessment for this user, level, and language
      const latestAssessment = await WritingAssessment.findOne({
        userId: userId,
        level: level,
        language: language
      }).sort({ completedAt: -1 });
      
      // If no previous assessment exists, user can take the assessment
      if (!latestAssessment) {
        return { available: true };
      }
      
      // Check if cooldown period has passed
      const now = new Date();
      const nextAvailableDate = latestAssessment.nextAvailableDate;
      
      if (now < nextAvailableDate) {
        // User must wait
        return {
          available: false,
          nextAvailableDate: nextAvailableDate
        };
      }
      
      // Cooldown period has passed, user can take the assessment
      return { available: true };
    } catch (error) {
      console.error('Error checking assessment availability:', error);
      // Default to allowing assessment if error occurs
      return { available: true };
    }
  }

  /**
   * Get a user's writing assessment history
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async getUserWritingAssessments(req, res) {
    try {
      const userId = req.params.userId || req.user?._id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User ID is required'
        });
      }
      
      // Validate MongoDB ObjectId
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user ID format'
        });
      }
      
      // Get user's assessment history
      const assessments = await WritingAssessment.find({ userId })
        .sort({ completedAt: -1 })
        .lean();
      
      return res.status(200).json({
        success: true,
        assessments
      });
    } catch (error) {
      console.error('Error getting user writing assessments:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get writing assessments',
        error: error.message
      });
    }
  }

  /**
   * Check if a user can take a writing assessment (not in cooldown period)
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async checkWritingAssessmentAvailability(req, res) {
    try {
      const { level, language } = req.query;
      const userId = req.user?._id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }
      
      if (!level || !language) {
        return res.status(400).json({
          success: false,
          message: 'Level and language are required'
        });
      }
      
      const availability = await this.checkAssessmentAvailability(userId, level, language);
      
      // If not available, try to get the last assessment for this level and language
      let lastAssessment = null;
      if (!availability.available && availability.nextAvailableDate) {
        try {
          // Find the most recent assessment for this user, level, and language
          lastAssessment = await WritingAssessment.findOne({
            userId: userId,
            level: level,
            language: language
          }).sort({ completedAt: -1 }).lean();
          
          if (lastAssessment) {
            console.log(`Found last assessment for user ${userId}, level ${level}, language ${language}`);
          }
        } catch (error) {
          console.error('Error fetching last assessment:', error);
        }
      }
      
      return res.status(200).json({
        success: true,
        ...availability,
        lastAssessment
      });
    } catch (error) {
      console.error('Error checking writing assessment availability:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to check assessment availability',
        error: error.message
      });
    }
  }

  /**
   * Get a specific writing assessment by ID
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async getWritingAssessmentById(req, res) {
    try {
      const { assessmentId } = req.params;
      
      if (!assessmentId || !mongoose.Types.ObjectId.isValid(assessmentId)) {
        return res.status(400).json({
          success: false,
          message: 'Valid assessment ID is required'
        });
      }
      
      const assessment = await WritingAssessment.findById(assessmentId);
      
      if (!assessment) {
        return res.status(404).json({
          success: false,
          message: 'Assessment not found'
        });
      }
      
      // Check if user has permission to view this assessment
      if (req.user.role !== 'admin' && req.user.role !== 'supervisor' && 
          assessment.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to view this assessment'
        });
      }
      
      return res.status(200).json({
        success: true,
        assessment
      });
    } catch (error) {
      console.error('Error getting writing assessment by ID:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get writing assessment',
        error: error.message
      });
    }
  }

  /**
   * Generate a new writing prompt based on level and language
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async generatePrompt(req, res) {
    try {
      const { level, language } = req.query;
      
      console.log('Writing assessment generatePrompt called with query params:', req.query);
      console.log('Generating writing prompt for:', { level, language });
      
      // Validate request
      if (!level || !language) {
        console.error('Missing required parameters:', { level, language });
        return res.status(400).json({
          success: false,
          message: 'Level and language are required'
        });
      }
      
      // Validate level
      const validLevels = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'];
      if (!validLevels.includes(level.toLowerCase())) {
        console.error('Invalid level:', level);
        return res.status(400).json({
          success: false,
          message: 'Invalid level. Must be one of: a1, a2, b1, b2, c1, c2'
        });
      }
      
      // Validate language
      const validLanguages = ['english', 'french'];
      if (!validLanguages.includes(language.toLowerCase())) {
        console.error('Invalid language:', language);
        return res.status(400).json({
          success: false,
          message: 'Invalid language. Must be one of: english, french'
        });
      }
      
      // Check if the user is authenticated
      const userId = req.user?._id;
      
      // If user is authenticated, check if they can take the assessment
      if (userId) {
        const availability = await this.checkAssessmentAvailability(userId, level, language);
        
        // If user can't take the assessment, return the last assessment prompt
        if (!availability.available && availability.nextAvailableDate) {
          console.log(`User ${userId} cannot take assessment for level ${level}, language ${language}`);
          
          try {
            // Find the most recent assessment for this user, level, and language
            const lastAssessment = await WritingAssessment.findOne({
              userId: userId,
              level: level,
              language: language
            }).sort({ completedAt: -1 }).lean();
            
            if (lastAssessment && lastAssessment.prompt) {
              console.log(`Returning last assessment prompt for user ${userId}`);
              return res.status(200).json({
                success: true,
                prompt: {
                  title: `${level.toUpperCase()} Writing Assessment`,
                  prompt: lastAssessment.prompt,
                  timeLimit: writingAssessmentService.getDefaultTimeLimit(level),
                  wordLimit: writingAssessmentService.getDefaultWordLimit(level),
                  criteria: writingAssessmentService.getDefaultCriteria(level, language),
                  isLastAssessment: true
                },
                canTakeAssessment: false,
                nextAvailableDate: availability.nextAvailableDate
              });
            }
          } catch (error) {
            console.error('Error fetching last assessment:', error);
            // Continue with normal prompt generation if error occurs
          }
        }
      }
      
      // Create cache key
      const cacheKey = `${level.toLowerCase()}_${language.toLowerCase()}`;
      
      // Check cache first
      const cachedPrompt = this.promptCache.get(cacheKey);
      if (cachedPrompt) {
        console.log('Using cached prompt for:', { level, language });
        return res.status(200).json({
          success: true,
          prompt: cachedPrompt,
          fromCache: true
        });
      }
      
      // Check if there's already a pending request for this prompt
      if (this.pendingRequests.has(cacheKey)) {
        console.log('Request already in progress for:', { level, language });
        
        try {
          // Wait for the existing request to complete
          const existingPromise = this.pendingRequests.get(cacheKey);
          const result = await existingPromise;
          
          console.log('Using result from parallel request for:', { level, language });
          return res.status(200).json({
            success: true,
            prompt: result,
            fromParallelRequest: true
          });
        } catch (error) {
          // If the existing request failed, we'll try again
          console.error('Parallel request failed, proceeding with new request:', error.message);
        }
      }
      
      console.log('Validation passed, calling writingAssessmentService.generateWritingPrompt');
      
      // Create a promise for this request and store it
      const promptPromise = this.generatePromptWithRetry(level, language);
      this.pendingRequests.set(cacheKey, promptPromise);
      
      try {
        // Wait for the prompt to be generated
        const prompt = await promptPromise;
        
        // Store in cache
        this.promptCache.set(cacheKey, prompt);
        
        // Set cache expiration
        setTimeout(() => {
          this.promptCache.delete(cacheKey);
          console.log(`Cache expired for prompt: ${cacheKey}`);
        }, this.cacheTTL);
        
        // Remove from pending requests
        this.pendingRequests.delete(cacheKey);
        
        // Return the generated prompt
        console.log('Sending successful response to client');
        return res.status(200).json({
          success: true,
          prompt
        });
      } catch (error) {
        // Remove from pending requests on error
        this.pendingRequests.delete(cacheKey);
        throw error;
      }
    } catch (error) {
      console.error('Error in generatePrompt controller:', {
        message: error.message,
        stack: error.stack
      });
      return res.status(500).json({
        success: false,
        message: 'Failed to generate writing prompt',
        error: error.message
      });
    }
  }
  
  /**
   * Generate prompt with retry logic
   * @param {string} level - CEFR level
   * @param {string} language - Language
   * @returns {Promise<Object>} - Generated prompt
   */
  async generatePromptWithRetry(level, language) {
    const maxRetries = 2;
    let attempt = 0;
    let lastError = null;
    
    while (attempt < maxRetries) {
      attempt++;
      try {
        // Generate prompt using service
        console.log(`Attempt ${attempt}/${maxRetries} to generate AI prompt`);
        const prompt = await writingAssessmentService.generateWritingPrompt(level, language);
        
        if (prompt) {
          console.log('Prompt generated successfully:', {
            title: prompt?.title,
            promptLength: prompt?.prompt?.length || 0,
            timeLimit: prompt?.timeLimit,
            wordLimit: prompt?.wordLimit,
            criteriaCount: prompt?.criteria?.length || 0
          });
          return prompt;
        }
      } catch (error) {
        lastError = error;
        console.error(`Error on attempt ${attempt}:`, error.message);
        
        // If we're rate limited (429), wait a bit longer before retrying
        if (error.response?.status === 429 && attempt < maxRetries) {
          const waitTime = 2000 * attempt; // 2 seconds, 4 seconds
          console.log(`Rate limited, waiting ${waitTime}ms before retry`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        } else {
          // For other errors, don't retry
          break;
        }
      }
    }
    
    // If we couldn't generate a prompt after retries
    console.error('Failed to generate AI prompt after', maxRetries, 'attempts');
    throw new Error(lastError?.message || 'Failed to generate AI writing prompt');
  }
}

export default new WritingAssessmentController(); 