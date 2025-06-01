// speakingAssessmentController.js
import mongoose from 'mongoose';
import speakingAssessmentService from '../services/speakingAssessmentService.js';
import speakingAssessmentTrackerService from '../services/speakingAssessmentTrackerService.js';

/**
 * Controller for speaking assessment endpoints
 */
class SpeakingAssessmentController {
  constructor() {
    // Bind instance methods to this context
    this.evaluateSpeaking = this.evaluateSpeaking.bind(this);
    this.checkAssessment = this.checkAssessment.bind(this);
    this.getUserAssessments = this.getUserAssessments.bind(this);
    this.getPendingAssessments = this.getPendingAssessments.bind(this);
    this.submitSupervisorEvaluation = this.submitSupervisorEvaluation.bind(this);
    this.getEvaluatedAssessment = this.getEvaluatedAssessment.bind(this);
    this.checkAssessmentAvailability = this.checkAssessmentAvailability.bind(this);
  }

  /**
   * Evaluate a speaking submission
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async evaluateSpeaking(req, res) {
    console.log('SpeakingAssessmentController.evaluateSpeaking called');
    
    // Check MongoDB connection
    if (mongoose?.connection?.readyState !== 1) {
      console.error('MongoDB connection not ready! Current state:', mongoose?.connection?.readyState);
    } else {
      console.log('MongoDB connection is ready for saving assessment');
    }
    try {
      const { question, audioBase64, videoBase64, transcribedText, userId, userName, userEmail, language, level, taskId, videoUrl, publicId, status } = req.body;
      
      console.log('Request body received:', {
        hasQuestion: !!question,
        questionLength: question?.length || 0,
        hasAudioBase64: !!audioBase64,
        hasVideoBase64: !!videoBase64,
        hasTranscribedText: !!transcribedText,
        transcribedTextLength: transcribedText?.length || 0,
        hasUserId: !!userId,
        userId: userId, // Log the actual userId
        hasUserName: !!userName,
        hasUserEmail: !!userEmail,
        hasLanguage: !!language,
        hasLevel: !!level,
        hasTaskId: !!taskId,
        hasVideoUrl: !!videoUrl,
        hasPublicId: !!publicId,
        status: status || 'not provided' // Log the status field
      });
      
      // Validate request
      if (!question) {
        console.log('Validation failed: Missing question');
        return res.status(400).json({
          success: false,
          message: 'Question is required'
        });
      }
      
      // Check if we have transcribed text or media data
      if (!transcribedText && !audioBase64 && !videoBase64) {
        console.log('Validation failed: Missing both transcribed text and audio data');
        return res.status(400).json({
          success: false,
          message: 'Either transcribed text or audio data is required'
        });
      }
      
      // Try to get user information if not provided in the request
      let userNameToSave = userName;
      let userEmailToSave = userEmail;
      
      if (userId && (!userNameToSave || !userEmailToSave)) {
        try {
          // Import User model
          const User = mongoose.model('User');
          
          // First try to find by _id if it looks like a MongoDB ObjectId
          if (mongoose.Types.ObjectId.isValid(userId)) {
            const userInfo = await User.findById(userId).select('name email').lean();
            if (userInfo) {
              userNameToSave = userNameToSave || userInfo.name;
              userEmailToSave = userEmailToSave || userInfo.email;
            }
          }
          
          // If not found and userId looks like an email, try by email
          if ((!userNameToSave || !userEmailToSave) && typeof userId === 'string' && userId.includes('@')) {
            const userInfo = await User.findOne({ email: userId }).select('name email').lean();
            if (userInfo) {
              userNameToSave = userNameToSave || userInfo.name;
              userEmailToSave = userEmailToSave || userInfo.email;
            }
          }
          
          // If still not found, try by userId field
          if (!userNameToSave || !userEmailToSave) {
            const userInfo = await User.findOne({ userId: userId }).select('name email').lean();
            if (userInfo) {
              userNameToSave = userNameToSave || userInfo.name;
              userEmailToSave = userEmailToSave || userInfo.email;
            }
          }
          
          console.log('Found user information:', { name: userNameToSave, email: userEmailToSave });
        } catch (error) {
          console.error(`Error fetching user info for userId ${userId}:`, error.message);
        }
      }
      
      // Check if the user has already completed an assessment for this level and task
      if (userId && language && level && taskId) {
        try {
          const existingAssessment = await speakingAssessmentTrackerService.getAssessment(
            userId, language, level, parseInt(taskId)
          );
          
          if (existingAssessment) {
            console.log(`User ${userId} already completed assessment for ${language} level ${level} task ${taskId}`);
            
            const assessmentData = {
              ...JSON.parse(existingAssessment.feedback),
              status: existingAssessment.status,
              supervisorFeedback: existingAssessment.supervisorFeedback,
              supervisorScore: existingAssessment.supervisorScore,
              evaluatedAt: existingAssessment.evaluatedAt,
              userName: existingAssessment.userName || userNameToSave,
              userEmail: existingAssessment.userEmail || userEmailToSave
            };
            
            return res.status(200).json({
              success: true,
              assessment: assessmentData,
              transcribedText: existingAssessment.transcribedText,
              message: 'Assessment already completed',
              videoUrl: existingAssessment.videoUrl,
              publicId: existingAssessment.publicId,
              status: existingAssessment.status,
              isExisting: true
            });
          }
        } catch (error) {
          console.error('Error checking existing assessment:', error);
          // Continue with new assessment if check fails
        }
      }
      
      // If transcribed text is provided, use it directly
      if (transcribedText) {
        console.log('Using provided transcribed text for assessment');
        if (transcribedText.length < 10) {
          console.log('Validation failed: Transcribed text too short');
          return res.status(400).json({
            success: false,
            message: 'Transcribed text is too short for meaningful assessment'
          });
        }
        
        console.log('Validation passed, calling speakingAssessmentService.evaluateTranscribedText');
        
        // Call the service to evaluate the text directly
        const result = await speakingAssessmentService.evaluateTranscribedText(question, transcribedText);
        
        console.log('Assessment received from service:', {
          success: result.success,
          hasAssessment: !!result.assessment,
          criteriaCount: result.assessment?.criteria?.length || 0,
          overallScore: result.assessment?.overallScore
        });
        
        // Ensure assessment has all required fields - provide defaults if missing
        if (!result.assessment) {
          console.warn('Service returned no assessment, creating fallback');
          result.assessment = {
            criteria: [
              { name: 'Overall Speaking', score: 7, maxScore: 9 }
            ],
            overallScore: 70,
            feedback: "Assessment generated as fallback due to service issue.",
            recommendations: ["Practice speaking regularly."]
          };
        }
        
        // Ensure overallScore exists
        if (result.assessment && !result.assessment.overallScore) {
          console.warn('Assessment missing overallScore, setting default');
          // Calculate from criteria if possible, otherwise use default
          if (result.assessment.criteria && result.assessment.criteria.length > 0) {
            const total = result.assessment.criteria.reduce((sum, c) => sum + c.score, 0);
            const avg = total / result.assessment.criteria.length;
            result.assessment.overallScore = Math.round((avg / 9) * 100); // Convert to percentage
          } else {
            result.assessment.overallScore = 70; // Default score
          }
        }
        
        // Save the assessment if user info and video info is provided
        if (language && level && taskId && videoUrl && publicId) {
          try {
            // Make sure userId is properly handled - use anonymous_ prefix if needed
            const userIdentifier = userId || `anonymous_${Date.now()}`;
            console.log('Saving assessment with userId:', userIdentifier);
            
            // Create a complete assessment object with all required fields
            const assessmentData = {
              userId: userIdentifier,
              userName: userNameToSave,
              userEmail: userEmailToSave,
              language,
              level,
              taskId: parseInt(taskId),
              videoUrl,
              publicId,
              score: result.assessment.overallScore,
              feedback: JSON.stringify(result.assessment),
              transcribedText,
              status: status || 'pending' // Use provided status or default to pending
            };
            
            console.log('Assessment data being saved:', {
              userId: assessmentData.userId,
              userName: assessmentData.userName,
              userEmail: assessmentData.userEmail,
              language: assessmentData.language,
              level: assessmentData.level,
              taskId: assessmentData.taskId,
              status: assessmentData.status,
              hasVideoUrl: !!assessmentData.videoUrl
            });
            
            const savedAssessment = await speakingAssessmentTrackerService.saveAssessment(assessmentData);
            
            console.log('Assessment saved:', savedAssessment._id);
          } catch (error) {
            console.error('Error saving assessment:', error);
            console.error('Error details:', {
              name: error.name,
              code: error.code,
              message: error.message
            });
            // Continue even if save fails
          }
        } else {
          console.warn('Missing required fields for assessment save:', {
            hasLanguage: !!language,
            hasLevel: !!level,
            hasTaskId: !!taskId,
            hasVideoUrl: !!videoUrl,
            hasPublicId: !!publicId
          });
        }
        
        // Return the assessment result to the client
        return res.status(200).json({
          success: true,
          assessment: result.assessment,
          transcribedText,
          message: result.message,
          videoUrl,
          publicId,
          status: status || 'pending',
          isExisting: false
        });
      }
      
      // If audio or video data is provided but no transcription
      if ((audioBase64 || videoBase64) && !transcribedText) {
        console.log('Audio/video data provided, but no transcription. This is not yet supported in the controller.');
        return res.status(501).json({
          success: false,
          message: 'Speech-to-text transcription in the controller is not yet implemented. Please provide transcribed text.'
        });
      }
      
      // We should never reach here if validation is working
      return res.status(400).json({
        success: false,
        message: 'Invalid request. Either transcribed text or audio data is required.'
      });
      
    } catch (error) {
      console.error('Error in evaluateSpeaking controller:', error);
      console.error('Error details:', {
        name: error.name,
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      
      return res.status(500).json({
        success: false,
        message: 'Error evaluating speaking submission: ' + error.message,
        error: error.message
      });
    }
  }

  /**
   * Check if a user has already completed an assessment
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async checkAssessment(req, res) {
    try {
      console.log('SpeakingAssessmentController.checkAssessment called');
      
      const { userId, language, level, taskId } = req.query;
      
      console.log('Check assessment parameters:', { userId, language, level, taskId });
      
      if (!userId || !language || !level || !taskId) {
        console.log('Validation failed: Missing required parameters');
        return res.status(400).json({
          success: false,
          message: 'userId, language, level, and taskId are required parameters'
        });
      }
      
      // First, check if the assessment exists
      const existingAssessment = await speakingAssessmentTrackerService.getAssessment(
        userId, language, level, parseInt(taskId)
      );
      
      if (existingAssessment) {
        console.log(`Found existing assessment for user ${userId}`);
        console.log('Assessment status:', existingAssessment.status);
        console.log('Supervisor score:', existingAssessment.supervisorScore);
        
        // Check for 7-day cooldown period if assessment has been evaluated
        if (existingAssessment.status === 'evaluated' && existingAssessment.evaluatedAt) {
          const now = new Date();
          const nextAvailableDate = existingAssessment.nextAvailableDate || 
            new Date(existingAssessment.evaluatedAt.getTime() + (7 * 24 * 60 * 60 * 1000));
          
          // If cooldown period has not passed, inform the user they need to wait
          if (now < nextAvailableDate) {
            const daysRemaining = Math.ceil((nextAvailableDate - now) / (24 * 60 * 60 * 1000));
            
            // Create a complete assessment object with all fields
            const assessmentData = {
              ...JSON.parse(existingAssessment.feedback),
              status: existingAssessment.status,
              supervisorFeedback: existingAssessment.supervisorFeedback,
              supervisorScore: existingAssessment.supervisorScore,
              evaluatedAt: existingAssessment.evaluatedAt
            };
            
            console.log('Sending assessment with supervisor score:', assessmentData.supervisorScore);
            
            return res.status(200).json({
              success: true,
              exists: true,
              canRetake: false,
              nextAvailableDate: nextAvailableDate,
              daysRemaining: daysRemaining,
              message: `You can retake this assessment in ${daysRemaining} days.`,
              assessment: assessmentData,
              supervisorScore: existingAssessment.supervisorScore, // Include at top level for backward compatibility
              transcribedText: existingAssessment.transcribedText,
              videoUrl: existingAssessment.videoUrl,
              publicId: existingAssessment.publicId,
              status: existingAssessment.status
            });
          }
          
          // If cooldown period has passed, allow retake
          return res.status(200).json({
            success: true,
            exists: true,
            canRetake: true,
            message: 'You can now retake this assessment.',
            assessment: {
              ...JSON.parse(existingAssessment.feedback),
              status: existingAssessment.status,
              supervisorFeedback: existingAssessment.supervisorFeedback,
              supervisorScore: existingAssessment.supervisorScore,
              evaluatedAt: existingAssessment.evaluatedAt
            },
            supervisorScore: existingAssessment.supervisorScore, // Include at top level for backward compatibility
            transcribedText: existingAssessment.transcribedText,
            videoUrl: existingAssessment.videoUrl,
            publicId: existingAssessment.publicId,
            status: existingAssessment.status
          });
        }
        
        // If assessment is pending or not evaluated, use the existing format
        const assessmentData = {
          ...JSON.parse(existingAssessment.feedback),
          status: existingAssessment.status,
          supervisorFeedback: existingAssessment.supervisorFeedback,
          supervisorScore: existingAssessment.supervisorScore,
          evaluatedAt: existingAssessment.evaluatedAt
        };
        
        console.log('Sending assessment data with supervisor score:', assessmentData.supervisorScore);
        
        return res.status(200).json({
          success: true,
          exists: true,
          canRetake: false,
          assessment: assessmentData,
          supervisorScore: existingAssessment.supervisorScore, // Include at top level for backward compatibility
          transcribedText: existingAssessment.transcribedText,
          videoUrl: existingAssessment.videoUrl,
          publicId: existingAssessment.publicId,
          status: existingAssessment.status
        });
      }
      
      console.log(`No existing assessment found for user ${userId}`);
      return res.status(200).json({
        success: true,
        exists: false,
        canRetake: true
      });
      
    } catch (error) {
      console.error('Error in checkAssessment controller:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Failed to check assessment status: ' + error.message,
        error: error.message
      });
    }
  }

  /**
   * Get all assessments for a user
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async getUserAssessments(req, res) {
    try {
      console.log('SpeakingAssessmentController.getUserAssessments called');
      
      const userId = req.params.userId || req.user?.id;
      
      if (!userId) {
        console.log('Validation failed: Missing userId');
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }
      
      console.log(`Fetching assessments for user ${userId}`);
      
      // Get all assessments for the user
      const assessments = await speakingAssessmentTrackerService.getUserAssessments(userId);
      
      console.log(`Found ${assessments.length} assessments for user ${userId}`);
      
      // Format the assessments
      const formattedAssessments = assessments.map(assessment => ({
        id: assessment._id,
        language: assessment.language,
        level: assessment.level,
        taskId: assessment.taskId,
        score: assessment.score,
        status: assessment.status,
        evaluatedAt: assessment.evaluatedAt,
        supervisorScore: assessment.supervisorScore,
        supervisorFeedback: assessment.supervisorFeedback,
        feedback: JSON.parse(assessment.feedback),
        videoUrl: assessment.videoUrl,
        publicId: assessment.publicId
      }));
      
      return res.status(200).json({
        success: true,
        assessments: formattedAssessments
      });
      
    } catch (error) {
      console.error('Error in getUserAssessments controller:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Failed to get user assessments: ' + error.message,
        error: error.message
      });
    }
  }

  /**
   * Get all pending assessments for supervisor review
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async getPendingAssessments(req, res) {
    try {
      console.log('SpeakingAssessmentController.getPendingAssessments called');
      
      // Import User model
      const User = mongoose.model('User');
      
      // Get all pending assessments
      const pendingAssessments = await speakingAssessmentTrackerService.getPendingAssessments();
      
      console.log(`Found ${pendingAssessments.length} pending assessments`);
      
      // Format the assessments with user information
      const formattedAssessments = await Promise.all(pendingAssessments.map(async assessment => {
        // Try to find user information if userId is available
        let userInfo = null;
        if (assessment.userId) {
          try {
            // First try to find by _id if it looks like a MongoDB ObjectId
            if (mongoose.Types.ObjectId.isValid(assessment.userId)) {
              userInfo = await User.findById(assessment.userId).select('name email').lean();
            }
            
            // If not found, try by email
            if (!userInfo && typeof assessment.userId === 'string' && assessment.userId.includes('@')) {
              userInfo = await User.findOne({ email: assessment.userId }).select('name email').lean();
            }
            
            // If still not found, try by userId field
            if (!userInfo) {
              userInfo = await User.findOne({ userId: assessment.userId }).select('name email').lean();
            }
            
            console.log(`User info for assessment ${assessment._id}:`, userInfo || 'Not found');
          } catch (error) {
            console.error(`Error fetching user info for userId ${assessment.userId}:`, error.message);
          }
        }
        
        return {
          id: assessment._id,
          userId: assessment.userId,
          userName: assessment.userName || userInfo?.name || null,
          userEmail: assessment.userEmail || userInfo?.email || null,
          userInfo: userInfo || { name: assessment.userName, email: assessment.userEmail },
          language: assessment.language,
          level: assessment.level,
          taskId: assessment.taskId,
          score: assessment.score,
          evaluatedAt: assessment.evaluatedAt,
          feedback: JSON.parse(assessment.feedback),
          transcribedText: assessment.transcribedText,
          videoUrl: assessment.videoUrl,
          publicId: assessment.publicId
        };
      }));
      
      return res.status(200).json({
        success: true,
        assessments: formattedAssessments
      });
      
    } catch (error) {
      console.error('Error in getPendingAssessments controller:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Failed to get pending assessments: ' + error.message,
        error: error.message
      });
    }
  }

  /**
   * Submit supervisor evaluation for an assessment
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async submitSupervisorEvaluation(req, res) {
    try {
      console.log('SpeakingAssessmentController.submitSupervisorEvaluation called');
      
      const { assessmentId } = req.params;
      // Log the entire request body
      console.log('Request body:', req.body);
      
      // Extract fields from request body - use the correct field names from the frontend
      const { supervisorId, score, feedback, criteria } = req.body;
      
      console.log(`Supervisor evaluation for assessment ${assessmentId}:`, {
        supervisorId,
        score,
        feedback: feedback?.substring(0, 50) + (feedback?.length > 50 ? '...' : ''),
        hasCriteria: !!criteria,
        criteriaCount: criteria?.length
      });
      
      if (!assessmentId) {
        console.log('Validation failed: Missing assessmentId');
        return res.status(400).json({
          success: false,
          message: 'Assessment ID is required'
        });
      }
      
      if (!supervisorId) {
        console.log('Validation failed: Missing supervisorId');
        return res.status(400).json({
          success: false,
          message: 'Supervisor ID is required'
        });
      }
      
      if (score === undefined || score === null) {
        console.log('Validation failed: Missing score');
        return res.status(400).json({
          success: false,
          message: 'Score is required'
        });
      }
      
      if (!feedback) {
        console.log('Validation failed: Missing feedback');
        return res.status(400).json({
          success: false,
          message: 'Feedback is required'
        });
      }
      
      // Convert score to number if it's a string
      const scoreValue = typeof score === 'string' ? parseInt(score) : score;
      
      // Calculate a normalized score out of 9 (if the input is out of 100)
      let normalizedScore = scoreValue;
      if (scoreValue > 9) {
        // Assuming the input score is out of 100 or 20*criteria count
        normalizedScore = Math.round((scoreValue / 100) * 9);
        console.log(`Normalized score from ${scoreValue} to ${normalizedScore} (out of 9)`);
      }
      
      // Validate criteria if provided
      let validatedCriteria = [];
      if (Array.isArray(criteria)) {
        validatedCriteria = criteria.map(criterion => ({
          name: criterion.name || 'Unnamed Criterion',
          score: parseInt(criterion.score || 0),
          feedback: criterion.feedback || '',
          maxScore: criterion.maxScore || 20
        }));
      }
      
      // Save the criteria data as part of the feedback
      const feedbackWithCriteria = {
        overallFeedback: feedback,
        criteria: validatedCriteria,
        rawScore: scoreValue,
        normalizedScore: normalizedScore,
        evaluatedAt: new Date().toISOString()
      };
      
      // Log the complete feedback object for debugging
      console.log('Complete feedback object:', JSON.stringify(feedbackWithCriteria, null, 2));
      
      // Convert to JSON string
      const feedbackJson = JSON.stringify(feedbackWithCriteria);
      
      console.log('Saving supervisor feedback:', {
        supervisorId,
        supervisorScore: normalizedScore,
        supervisorFeedbackSample: feedbackJson.substring(0, 100) + (feedbackJson.length > 100 ? '...' : ''),
        status: 'evaluated'
      });
      
      // Get the assessment to include user info in response
      const assessment = await speakingAssessmentTrackerService.getAssessmentById(assessmentId);
      if (!assessment) {
        console.log(`Assessment ${assessmentId} not found`);
        return res.status(404).json({
          success: false,
          message: 'Assessment not found'
        });
      }
      
      // Update the assessment with supervisor evaluation
      const updatedAssessment = await speakingAssessmentTrackerService.updateAssessment(
        assessmentId,
        {
          supervisorId,
          supervisorScore: normalizedScore,
          supervisorFeedback: feedbackJson,
          status: 'evaluated',
          evaluatedAt: new Date()
        }
      );
      
      if (!updatedAssessment) {
        console.log(`Assessment ${assessmentId} not found or update failed`);
        return res.status(404).json({
          success: false,
          message: 'Assessment not found or update failed'
        });
      }
      
      console.log(`Assessment ${assessmentId} updated with supervisor evaluation`);
      
      // Parse the feedback for the response
      let parsedFeedback = null;
      try {
        parsedFeedback = JSON.parse(updatedAssessment.supervisorFeedback);
      } catch (error) {
        console.error('Error parsing supervisor feedback:', error);
      }
      
      return res.status(200).json({
        success: true,
        message: 'Supervisor evaluation submitted successfully',
        assessment: {
          id: updatedAssessment._id,
          userId: updatedAssessment.userId,
          userName: updatedAssessment.userName,
          userEmail: updatedAssessment.userEmail,
          language: updatedAssessment.language,
          level: updatedAssessment.level,
          taskId: updatedAssessment.taskId,
          score: updatedAssessment.score,
          supervisorScore: updatedAssessment.supervisorScore,
          supervisorFeedback: updatedAssessment.supervisorFeedback,
          parsedFeedback: parsedFeedback,
          status: updatedAssessment.status,
          evaluatedAt: updatedAssessment.evaluatedAt
        }
      });
      
    } catch (error) {
      console.error('Error in submitSupervisorEvaluation controller:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Failed to submit supervisor evaluation: ' + error.message,
        error: error.message
      });
    }
  }

  /**
   * Get a specific evaluated assessment by ID
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async getEvaluatedAssessment(req, res) {
    try {
      console.log('SpeakingAssessmentController.getEvaluatedAssessment called');
      
      const { assessmentId } = req.params;
      
      if (!assessmentId) {
        console.log('Validation failed: Missing assessmentId');
        return res.status(400).json({
          success: false,
          message: 'Assessment ID is required'
        });
      }
      
      console.log(`Fetching assessment ${assessmentId}`);
      
      // Get the assessment by ID
      const assessment = await speakingAssessmentTrackerService.getAssessmentById(assessmentId);
      
      if (!assessment) {
        console.log(`Assessment ${assessmentId} not found`);
        return res.status(404).json({
          success: false,
          message: 'Assessment not found'
        });
      }
      
      console.log(`Found assessment ${assessmentId}`);
      
      // Format the assessment
      const formattedAssessment = {
        id: assessment._id,
        userId: assessment.userId,
        language: assessment.language,
        level: assessment.level,
        taskId: assessment.taskId,
        score: assessment.score,
        supervisorScore: assessment.supervisorScore,
        supervisorFeedback: assessment.supervisorFeedback,
        status: assessment.status,
        evaluatedAt: assessment.evaluatedAt,
        feedback: JSON.parse(assessment.feedback),
        transcribedText: assessment.transcribedText,
        videoUrl: assessment.videoUrl,
        publicId: assessment.publicId
      };
      
      return res.status(200).json({
        success: true,
        assessment: formattedAssessment
      });
      
    } catch (error) {
      console.error('Error in getEvaluatedAssessment controller:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Failed to get evaluated assessment: ' + error.message,
        error: error.message
      });
    }
  }

  /**
   * Check if user can take an assessment (cooldown period)
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async checkAssessmentAvailability(req, res) {
    try {
      console.log('SpeakingAssessmentController.checkAssessmentAvailability called');
      
      const userId = req.user?.id;
      const { language, level, taskId } = req.query;
      
      if (!userId) {
        console.log('Validation failed: User not authenticated');
        return res.status(401).json({
          success: false,
          message: 'User must be authenticated to check assessment availability'
        });
      }
      
      if (!language || !level) {
        console.log('Validation failed: Missing language or level');
        return res.status(400).json({
          success: false,
          message: 'Language and level are required parameters'
        });
      }
      
      console.log(`Checking assessment availability for user ${userId}, language ${language}, level ${level}`);
      
      // Use the canTakeAssessment method from the service which already handles 7-day cooldown
      const availability = await speakingAssessmentTrackerService.canTakeAssessment(
        userId, language, level, parseInt(taskId || 1)
      );
      
      if (availability.available) {
        return res.status(200).json({
          success: true,
          canTakeAssessment: true,
          message: 'User can take assessment'
        });
      } else if (availability.pendingReview) {
        return res.status(200).json({
          success: true,
          canTakeAssessment: false,
          pendingReview: true,
          assessmentId: availability.assessmentId,
          message: 'User has a pending assessment awaiting review'
        });
      } else {
        // Calculate days remaining
        const now = new Date();
        const daysRemaining = Math.ceil((availability.nextAvailableDate - now) / (24 * 60 * 60 * 1000));
        
        return res.status(200).json({
          success: true,
          canTakeAssessment: false,
          nextAvailableDate: availability.nextAvailableDate,
          daysRemaining: daysRemaining,
          message: `Cooldown period not yet passed, ${daysRemaining} days remaining`
        });
      }
    } catch (error) {
      console.error('Error in checkAssessmentAvailability controller:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Failed to check assessment availability: ' + error.message,
        error: error.message
      });
    }
  }
}

export default new SpeakingAssessmentController(); 