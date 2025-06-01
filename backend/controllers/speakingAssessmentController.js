// speakingAssessmentController.js
import mongoose from 'mongoose';
import speakingAssessmentService from '../services/speakingAssessmentService.js';
import speakingAssessmentTrackerService from '../services/speakingAssessmentTrackerService.js';
import User from '../src/models/User.js';

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
      const { question, audioBase64, videoBase64, transcribedText, userId, language, level, taskId, videoUrl, publicId, status } = req.body;
      
      console.log('Request body received:', {
        hasQuestion: !!question,
        questionLength: question?.length || 0,
        hasAudioBase64: !!audioBase64,
        hasVideoBase64: !!videoBase64,
        hasTranscribedText: !!transcribedText,
        transcribedTextLength: transcribedText?.length || 0,
        hasUserId: !!userId,
        userId: userId, // Log the actual userId
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
              evaluatedAt: existingAssessment.evaluatedAt
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
            
            // Try to get user information to store with the assessment
            let userName = null;
            let userEmail = null;
            
            try {
              if (mongoose.Types.ObjectId.isValid(userIdentifier)) {
                const user = await User.findById(userIdentifier);
                if (user) {
                  userName = user.name;
                  userEmail = user.email;
                  console.log(`Found user by ID: ${userName}, ${userEmail}`);
                }
              }
              
              if (!userName && !isNaN(userIdentifier)) {
                const user = await User.findOne({ userId: userIdentifier });
                if (user) {
                  userName = user.name;
                  userEmail = user.email;
                  console.log(`Found user by numeric ID: ${userName}, ${userEmail}`);
                }
              }
            } catch (userLookupError) {
              console.error('Error looking up user:', userLookupError);
            }
            
            // Create a complete assessment object with all required fields
            const assessmentData = {
              userId: userIdentifier,
              userName: userName,  // Store user name directly
              userEmail: userEmail, // Store user email directly
              language,
              level,
              taskId: parseInt(taskId),
              videoUrl,
              publicId,
              score: result.assessment.overallScore,
              feedback: JSON.stringify(result.assessment),
              transcribedText,
              status: status || 'pending', // Use provided status or default to pending
              prompt: question // Store the prompt/question
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
            hasUserId: !!userId,
            hasLanguage: !!language,
            hasLevel: !!level,
            hasTaskId: !!taskId,
            hasVideoUrl: !!videoUrl,
            hasPublicId: !!publicId
          });
        }
        
        // Add status to the assessment result
        const assessmentWithStatus = {
          ...result.assessment,
          status: 'pending',
          pendingReview: true
        };
        
        // Return the assessment results
        console.log('Sending successful response to client');
        return res.status(200).json({
          success: true,
          assessment: assessmentWithStatus,
          status: 'pending',
          assessmentId: savedAssessment ? savedAssessment._id.toString() : null,
          message: result.message + ' Your assessment is pending review by a supervisor.'
        });
      } 
      // Otherwise use audio/video processing flow
      else {
        // Support both audioBase64 and videoBase64 for backward compatibility
        const mediaBase64 = audioBase64 || videoBase64;
        
        if (mediaBase64.length < 1000) {
          console.log('Validation failed: Media data too small, likely invalid');
          return res.status(400).json({
            success: false,
            message: 'Audio data appears to be invalid or too small'
          });
        }
        
        console.log('Validation passed, calling speakingAssessmentService.evaluateSpeaking');
        
        // Call the service to evaluate the recording
        const result = await speakingAssessmentService.evaluateSpeaking(question, mediaBase64);
        
        console.log('Assessment received from service:', {
          success: result.success,
          hasAssessment: !!result.assessment,
          criteriaCount: result.assessment?.criteria?.length || 0,
          overallScore: result.assessment?.overallScore,
          hasTranscribedText: !!result.transcribedText
        });
        
        // Save the assessment if user info and video info is provided
        if (language && level && taskId && videoUrl && publicId) {
          try {
            // Make sure userId is properly handled - use anonymous_ prefix if needed
            const userIdentifier = userId || `anonymous_${Date.now()}`;
            console.log('Saving assessment with userId:', userIdentifier);
            
            // Try to get user information to store with the assessment
            let userName = null;
            let userEmail = null;
            
            try {
              if (mongoose.Types.ObjectId.isValid(userIdentifier)) {
                const user = await User.findById(userIdentifier);
                if (user) {
                  userName = user.name;
                  userEmail = user.email;
                  console.log(`Found user by ID: ${userName}, ${userEmail}`);
                }
              }
              
              if (!userName && !isNaN(userIdentifier)) {
                const user = await User.findOne({ userId: userIdentifier });
                if (user) {
                  userName = user.name;
                  userEmail = user.email;
                  console.log(`Found user by numeric ID: ${userName}, ${userEmail}`);
                }
              }
            } catch (userLookupError) {
              console.error('Error looking up user:', userLookupError);
            }
            
            // Create a complete assessment object with all required fields
            const assessmentData = {
              userId: userIdentifier,
              userName: userName,  // Store user name directly
              userEmail: userEmail, // Store user email directly
              language,
              level,
              taskId: parseInt(taskId),
              videoUrl,
              publicId,
              score: result.assessment.overallScore,
              feedback: JSON.stringify(result.assessment),
              transcribedText: result.transcribedText,
              status: status || 'pending', // Use provided status or default to pending
              prompt: question // Store the prompt/question
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
            hasUserId: !!userId,
            hasLanguage: !!language,
            hasLevel: !!level,
            hasTaskId: !!taskId,
            hasVideoUrl: !!videoUrl,
            hasPublicId: !!publicId
          });
        }
        
        // Add status to the assessment result
        const assessmentWithStatus = {
          ...result.assessment,
          status: 'pending',
          pendingReview: true
        };
        
        // Return the assessment results
        console.log('Sending successful response to client');
        return res.status(200).json({
          success: true,
          assessment: assessmentWithStatus,
          transcribedText: result.transcribedText,
          status: 'pending',
          assessmentId: savedAssessment ? savedAssessment._id.toString() : null,
          message: result.message + ' Your assessment is pending review by a supervisor.'
        });
      }
    } catch (error) {
      console.error('Error in evaluateSpeaking controller:', {
        message: error.message,
        stack: error.stack
      });
      return res.status(500).json({
        success: false,
        message: 'Failed to evaluate speaking: ' + error.message,
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
      const { userId, language, level, taskId } = req.query;
      
      if (!userId || !language || !level || !taskId) {
        return res.status(400).json({
          success: false,
          message: 'UserId, language, level, and taskId are required'
        });
      }
      
      const hasCompleted = await speakingAssessmentTrackerService.hasCompletedAssessment(
        userId, language, level, parseInt(taskId)
      );
      
      if (hasCompleted) {
        const assessment = await speakingAssessmentTrackerService.getAssessment(
          userId, language, level, parseInt(taskId)
        );
        
        // Log what we're sending back to help debug
        console.log('Returning assessment data to client:', {
          assessmentId: assessment._id,
          status: assessment.status,
          hasSupervisorFeedback: !!assessment.supervisorFeedback,
          supervisorScore: assessment.supervisorScore,
          evaluatedAt: assessment.evaluatedAt
        });
        
        // Parse feedback JSON and combine with other fields for a complete assessment object
        const feedbackObj = JSON.parse(assessment.feedback);
        const assessmentData = {
          ...feedbackObj,
          status: assessment.status,
          supervisorFeedback: assessment.supervisorFeedback,
          supervisorScore: assessment.supervisorScore,
          evaluatedAt: assessment.evaluatedAt
        };
        
        return res.status(200).json({
          success: true,
          hasCompleted: true,
          assessment: assessmentData,
          videoUrl: assessment.videoUrl,
          publicId: assessment.publicId,
          transcribedText: assessment.transcribedText,
          status: assessment.status
        });
      }
      
      return res.status(200).json({
        success: true,
        hasCompleted: false
      });
      
    } catch (error) {
      console.error('Error checking assessment:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to check assessment: ' + error.message
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
      const { userId } = req.params;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'UserId is required'
        });
      }
      
      const assessments = await speakingAssessmentTrackerService.getUserAssessments(userId);
      
      // Transform assessment data for client
      const transformedAssessments = assessments.map(assessment => ({
        id: assessment._id,
        language: assessment.language,
        level: assessment.level,
        taskId: assessment.taskId,
        videoUrl: assessment.videoUrl,
        score: assessment.score,
        status: assessment.status,
        supervisorScore: assessment.supervisorScore,
        supervisorFeedback: assessment.supervisorFeedback,
        evaluatedAt: assessment.evaluatedAt,
        createdAt: assessment.createdAt,
        feedback: JSON.parse(assessment.feedback)
      }));
      
      return res.status(200).json({
        success: true,
        assessments: transformedAssessments
      });
      
    } catch (error) {
      console.error('Error getting user assessments:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get user assessments: ' + error.message
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
      const pendingAssessments = await speakingAssessmentTrackerService.getPendingAssessments();
      
      console.log(`Found ${pendingAssessments.length} pending assessments`);
      
      // Transform assessment data for client
      const transformedAssessments = await Promise.all(pendingAssessments.map(async assessment => {
        // Try to find user information - first use stored values if available
        let userInfo = { name: 'Unknown User' };
        
        if (assessment.userName) {
          userInfo = {
            name: assessment.userName,
            email: assessment.userEmail || 'No email'
          };
          console.log(`Using stored user info: ${assessment.userName}`);
        } else {
          try {
            if (assessment.userId) {
              console.log(`Trying to find user info for userId: ${assessment.userId}, type: ${typeof assessment.userId}`);
              
              // Check if userId is a number (from User model) or string (MongoDB ObjectId)
              if (!isNaN(assessment.userId)) {
                // If it's a number, search by userId field
                console.log(`Looking up user by numeric userId: ${assessment.userId}`);
                const user = await User.findOne({ userId: assessment.userId });
                if (user) {
                  console.log(`Found user by userId: ${user.name}, ${user.email}`);
                  userInfo = {
                    name: user.name,
                    email: user.email
                  };
                } else {
                  console.log(`No user found with userId: ${assessment.userId}`);
                }
              } else {
                // If it might be an ObjectId, try to find by _id
                if (mongoose.Types.ObjectId.isValid(assessment.userId)) {
                  console.log(`Looking up user by ObjectId: ${assessment.userId}`);
                  const user = await User.findById(assessment.userId);
                  if (user) {
                    console.log(`Found user by ObjectId: ${user.name}, ${user.email}`);
                    userInfo = {
                      name: user.name,
                      email: user.email
                    };
                  } else {
                    console.log(`No user found with ObjectId: ${assessment.userId}`);
                    
                    // Try as a string user ID as fallback
                    const userByStringId = await User.findOne({ userId: assessment.userId });
                    if (userByStringId) {
                      console.log(`Found user by string userId: ${userByStringId.name}, ${userByStringId.email}`);
                      userInfo = {
                        name: userByStringId.name,
                        email: userByStringId.email
                      };
                    }
                  }
                } else {
                  console.log(`UserId is not a valid ObjectId: ${assessment.userId}`);
                  
                  // Try one more approach - direct string comparison
                  const userByExactMatch = await User.findOne({ 
                    $or: [
                      { userId: assessment.userId },
                      { _id: assessment.userId },
                      { email: assessment.userId }
                    ]
                  });
                  
                  if (userByExactMatch) {
                    console.log(`Found user by alternative lookup: ${userByExactMatch.name}`);
                    userInfo = {
                      name: userByExactMatch.name,
                      email: userByExactMatch.email
                    };
                  }
                }
              }
            }
          } catch (userError) {
            console.warn(`Could not retrieve user info for userId ${assessment.userId}:`, userError.message);
          }
        }
        
        return {
          id: assessment._id,
          userId: assessment.userId,
          userInfo: userInfo,
          language: assessment.language,
          level: assessment.level,
          taskId: assessment.taskId,
          videoUrl: assessment.videoUrl,
          score: assessment.score,
          transcribedText: assessment.transcribedText,
          createdAt: assessment.createdAt,
          prompt: assessment.prompt || "Speaking assessment task",
          feedback: JSON.parse(assessment.feedback)
        };
      }));
      
      return res.status(200).json({
        success: true,
        assessments: transformedAssessments
      });
      
    } catch (error) {
      console.error('Error getting pending assessments:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get pending assessments: ' + error.message
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
      const { assessmentId } = req.params;
      // Log the entire request body for debugging
      console.log('Request body:', req.body);
      
      const { supervisorId, score, feedback, criteria } = req.body;
      
      console.log('submitSupervisorEvaluation called with:', {
        assessmentId,
        supervisorId,
        score: score,
        feedback: feedback?.substring(0, 50) + (feedback?.length > 50 ? '...' : ''),
        hasCriteria: !!criteria,
        criteriaLength: criteria?.length
      });
      
      // Check if required fields are present
      if (!assessmentId) {
        return res.status(400).json({
          success: false,
          message: 'Assessment ID is required'
        });
      }
      
      if (!supervisorId) {
        return res.status(400).json({
          success: false,
          message: 'Supervisor ID is required'
        });
      }
      
      if (score === undefined || score === null) {
        return res.status(400).json({
          success: false,
          message: 'Score is required'
        });
      }
      
      if (!feedback) {
        return res.status(400).json({
          success: false,
          message: 'Feedback is required'
        });
      }
      
      // Ensure assessmentId is a valid MongoDB ObjectId
      if (!assessmentId.match(/^[0-9a-fA-F]{24}$/)) {
        console.error('Invalid assessment ID format:', assessmentId);
        return res.status(400).json({
          success: false,
          message: 'Invalid assessment ID format'
        });
      }
      
      // Convert score to number if it's a string
      const scoreValue = typeof score === 'string' ? parseInt(score) : score;
      
      console.log('Calling service with:', {
        assessmentId,
        supervisorId,
        score: scoreValue,
        feedbackLength: feedback?.length
      });
      
      // Save the criteria data as part of the feedback
      const feedbackWithCriteria = {
        overallFeedback: feedback,
        criteria: criteria || []
      };
      
      // Convert to JSON string
      const feedbackJson = JSON.stringify(feedbackWithCriteria);
      
      const updatedAssessment = await speakingAssessmentTrackerService.submitSupervisorEvaluation(
        assessmentId, supervisorId, scoreValue, feedbackJson
      );
      
      return res.status(200).json({
        success: true,
        assessment: {
          id: updatedAssessment._id,
          userId: updatedAssessment.userId,
          language: updatedAssessment.language,
          level: updatedAssessment.level,
          taskId: updatedAssessment.taskId,
          status: updatedAssessment.status,
          supervisorScore: updatedAssessment.supervisorScore,
          supervisorFeedback: updatedAssessment.supervisorFeedback,
          evaluatedAt: updatedAssessment.evaluatedAt
        },
        message: 'Evaluation submitted successfully'
      });
      
    } catch (error) {
      console.error('Error submitting evaluation:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to submit evaluation: ' + error.message
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
      const { assessmentId } = req.params;
      
      if (!assessmentId) {
        return res.status(400).json({
          success: false,
          message: 'Assessment ID is required'
        });
      }
      
      // Validate MongoDB ObjectId
      if (!mongoose.Types.ObjectId.isValid(assessmentId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid assessment ID format'
        });
      }
      
      // Find the assessment by ID
      const assessment = await speakingAssessmentTrackerService.getAssessmentById(assessmentId);
      
      if (!assessment) {
        return res.status(404).json({
          success: false,
          message: 'Assessment not found'
        });
      }
      
      // Format the assessment for the response
      const formattedAssessment = {
        id: assessment._id,
        userId: assessment.userId,
        language: assessment.language,
        level: assessment.level,
        taskId: assessment.taskId,
        videoUrl: assessment.videoUrl,
        publicId: assessment.publicId,
        score: assessment.score,
        feedback: assessment.feedback,
        transcribedText: assessment.transcribedText,
        status: assessment.status,
        supervisorId: assessment.supervisorId,
        supervisorFeedback: assessment.supervisorFeedback,
        supervisorScore: assessment.supervisorScore,
        evaluatedAt: assessment.evaluatedAt,
        createdAt: assessment.createdAt
      };
      
      return res.status(200).json({
        success: true,
        assessment: formattedAssessment
      });
      
    } catch (error) {
      console.error('Error getting evaluated assessment:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get assessment: ' + error.message
      });
    }
  }
  
  /**
   * Check if a user can take an assessment (based on cooldown period)
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async checkAssessmentAvailability(req, res) {
    try {
      const { language, level, taskId } = req.query;
      const userId = req.user?._id || req.user?.id || req.userId;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User ID is required'
        });
      }
      
      if (!language || !level || !taskId) {
        return res.status(400).json({
          success: false,
          message: 'Language, level, and taskId are required'
        });
      }
      
      const availability = await speakingAssessmentTrackerService.canTakeAssessment(
        userId, language, level, parseInt(taskId)
      );
      
      return res.status(200).json({
        success: true,
        ...availability
      });
      
    } catch (error) {
      console.error('Error checking assessment availability:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to check assessment availability: ' + error.message
      });
    }
  }
}

export default new SpeakingAssessmentController(); 