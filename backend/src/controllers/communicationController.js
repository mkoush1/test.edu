// communicationController.js
import User from '../models/User.js';
import Assessment from '../models/Assessment.js';
import AssessmentResult from '../models/assessmentResult.js';
import writingAssessmentTrackerService from '../services/writingAssessmentTrackerService.js';

/**
 * Controller for communication assessment endpoints
 */
class CommunicationController {
  /**
   * Submit communication assessment results
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async submitCommunicationAssessment(req, res) {
    console.log('CommunicationController.submitCommunicationAssessment called');
    try {
      const { type, level, language, score, tasks, feedback, recommendations } = req.body;
      const userId = req.userId;
      
      console.log('Request body received:', {
        type,
        level,
        language,
        score,
        tasksCount: tasks?.length || 0,
        hasRecommendations: !!recommendations
      });
      
      // Validate request
      if (!type || !score) {
        console.log('Validation failed: Missing type or score');
        return res.status(400).json({
          success: false,
          message: 'Type and score are required'
        });
      }
      
      // Save assessment result
      const assessmentResult = new AssessmentResult({
        userId,
        assessmentType: 'communication',
        score,
        completedAt: new Date(),
        details: {
          type, // e.g., 'writing', 'reading', 'listening', 'speaking'
          level,
          language,
          feedback,
          recommendations,
          tasks: tasks?.map(task => ({
            title: task.title,
            response: task.response,
            wordCount: task.wordCount,
            metrics: task.metrics
          }))
        }
      });
      
      await assessmentResult.save();
      console.log('Communication assessment result saved successfully');
      
      // If this is a writing assessment, save it to the writing assessment tracker
      if (type === 'writing' && tasks?.length > 0) {
        try {
          const task = tasks[0]; // Get the first task
          await writingAssessmentTrackerService.saveAssessment({
            userId,
            language,
            level,
            prompt: task.prompt,
            response: task.response,
            score,
            feedback,
            criteria: task.aiEvaluation?.criteria || []
          });
          console.log('Writing assessment saved to tracker successfully');
        } catch (error) {
          console.error('Error saving to writing assessment tracker:', error);
          // Continue with the process even if tracker save fails
        }
      }
      
      // Update user's completed assessments and progress
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      // Check if user has already completed this assessment type
      const existingAssessmentIndex = user.completedAssessments.findIndex(
        a => a.assessmentType === 'communication'
      );
      
      if (existingAssessmentIndex !== -1) {
        // Update existing assessment score
        user.completedAssessments[existingAssessmentIndex] = {
          assessmentType: 'communication',
          completedAt: new Date(),
          score
        };
      } else {
        // Add new completion
        user.completedAssessments.push({
          assessmentType: 'communication',
          completedAt: new Date(),
          score
        });
        user.totalAssessmentsCompleted += 1;
      }
      
      // Update progress
      const totalAssessments = await Assessment.countDocuments();
      user.progress = Math.min(100, (user.totalAssessmentsCompleted / totalAssessments) * 100);
      
      await user.save();
      console.log('User progress updated successfully');
      
      // Get updated assessment status for response
      const availableAssessments = await Assessment.find();
      const completedAssessmentTypes = user.completedAssessments.map(a => a.assessmentType);
      const remainingAssessments = availableAssessments.filter(
        assessment => !completedAssessmentTypes.includes(assessment.category)
      );
      
      // Return success response
      return res.status(200).json({
        success: true,
        message: 'Communication assessment submitted successfully',
        result: {
          score,
          assessmentStatus: {
            completedAssessments: user.completedAssessments,
            totalCompleted: user.totalAssessmentsCompleted,
            progress: user.progress,
            remainingCount: remainingAssessments.length
          }
        }
      });
    } catch (error) {
      console.error('Error in submitCommunicationAssessment controller:', {
        message: error.message,
        stack: error.stack
      });
      return res.status(500).json({
        success: false,
        message: 'Failed to submit communication assessment',
        error: error.message
      });
    }
  }

  /**
   * Get aggregated communication assessment data for a user
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async getCommunicationAssessments(req, res) {
    try {
      const userId = req.userId;
      
      // Safety check for AssessmentResult model
      if (!AssessmentResult) {
        console.error('AssessmentResult model is not available');
        return res.status(200).json({
          success: true,
          data: {
            overallScore: 0,
            aggregatedScores: { reading: 0, writing: 0, listening: 0, speaking: 0 },
            completionStatus: { reading: false, writing: false, listening: false, speaking: false },
            completionPercentage: 0,
            totalCompleted: 0,
            latestAssessments: { reading: null, writing: null, listening: null, speaking: null },
            allAssessments: { reading: [], writing: [], listening: [], speaking: [], communication: [] }
          }
        });
      }
      
      // Find all communication-related assessment results for the user
      let assessmentResults;
      try {
        assessmentResults = await AssessmentResult.find({
          userId,
          assessmentType: { $in: ['communication', 'reading', 'writing', 'listening', 'speaking'] }
        }).sort({ completedAt: -1 });
      } catch (modelError) {
        console.error('Error querying AssessmentResult model:', modelError);
        // Return empty data instead of an error
        return res.status(200).json({
          success: true,
          data: {
            overallScore: 0,
            aggregatedScores: { reading: 0, writing: 0, listening: 0, speaking: 0 },
            completionStatus: { reading: false, writing: false, listening: false, speaking: false },
            completionPercentage: 0,
            totalCompleted: 0,
            latestAssessments: { reading: null, writing: null, listening: null, speaking: null },
            allAssessments: { reading: [], writing: [], listening: [], speaking: [], communication: [] }
          }
        });
      }
      
      // If no results, return empty data
      if (!assessmentResults || assessmentResults.length === 0) {
        return res.status(200).json({
          success: true,
          data: {
            overallScore: 0,
            aggregatedScores: { reading: 0, writing: 0, listening: 0, speaking: 0 },
            completionStatus: { reading: false, writing: false, listening: false, speaking: false },
            completionPercentage: 0,
            totalCompleted: 0,
            latestAssessments: { reading: null, writing: null, listening: null, speaking: null },
            allAssessments: { reading: [], writing: [], listening: [], speaking: [], communication: [] }
          }
        });
      }
      
      // Group results by assessment type
      const groupedResults = {
        reading: [],
        writing: [],
        listening: [],
        speaking: [],
        communication: []
      };
      
      // Process and group results
      assessmentResults.forEach(result => {
        try {
          const resultData = {
            id: result._id,
            assessmentType: result.assessmentType,
            score: result.score,
            completedAt: result.completedAt,
            details: result.details || {}
          };
          
          if (groupedResults[result.assessmentType]) {
            groupedResults[result.assessmentType].push(resultData);
          }
        } catch (parseError) {
          console.error('Error processing assessment result:', parseError);
          // Continue with other results
        }
      });
      
      // Calculate aggregated scores
      const aggregatedScores = {
        reading: this.calculateAverageScore(groupedResults.reading),
        writing: this.calculateAverageScore(groupedResults.writing),
        listening: this.calculateAverageScore(groupedResults.listening),
        speaking: this.calculateAverageScore(groupedResults.speaking)
      };
      
      // Calculate overall communication score (average of all sub-types)
      const overallScore = this.calculateOverallScore(aggregatedScores);
      
      // Calculate completion status for each type
      const completionStatus = {
        reading: groupedResults.reading.length > 0,
        writing: groupedResults.writing.length > 0,
        listening: groupedResults.listening.length > 0,
        speaking: groupedResults.speaking.length > 0
      };
      
      // Calculate total completed assessments
      const totalCompleted = Object.values(completionStatus).filter(Boolean).length;
      const completionPercentage = (totalCompleted / 4) * 100;
      
      // Get latest assessment of each type
      const latestAssessments = {
        reading: groupedResults.reading[0] || null,
        writing: groupedResults.writing[0] || null,
        listening: groupedResults.listening[0] || null,
        speaking: groupedResults.speaking[0] || null
      };
      
      // Return the aggregated data
      return res.status(200).json({
        success: true,
        data: {
          overallScore,
          aggregatedScores,
          completionStatus,
          completionPercentage,
          totalCompleted,
          latestAssessments,
          allAssessments: groupedResults
        }
      });
    } catch (error) {
      console.error('Error in getCommunicationAssessments controller:', {
        message: error.message,
        stack: error.stack
      });
      
      // Return empty data instead of an error
      return res.status(200).json({
        success: true,
        data: {
          overallScore: 0,
          aggregatedScores: { reading: 0, writing: 0, listening: 0, speaking: 0 },
          completionStatus: { reading: false, writing: false, listening: false, speaking: false },
          completionPercentage: 0,
          totalCompleted: 0,
          latestAssessments: { reading: null, writing: null, listening: null, speaking: null },
          allAssessments: { reading: [], writing: [], listening: [], speaking: [], communication: [] }
        }
      });
    }
  }
  
  /**
   * Calculate average score for an assessment type
   * @param {Array} assessments - List of assessments
   * @returns {Number} - Average score
   */
  calculateAverageScore(assessments) {
    if (!assessments || assessments.length === 0) {
      return 0;
    }
    
    const totalScore = assessments.reduce((sum, assessment) => sum + assessment.score, 0);
    return Math.round(totalScore / assessments.length);
  }
  
  /**
   * Calculate overall communication score
   * @param {Object} scores - Scores for each assessment type
   * @returns {Number} - Overall score
   */
  calculateOverallScore(scores) {
    const validScores = Object.values(scores).filter(score => score > 0);
    
    if (validScores.length === 0) {
      return 0;
    }
    
    const totalScore = validScores.reduce((sum, score) => sum + score, 0);
    return Math.round(totalScore / validScores.length);
  }
}

export default new CommunicationController(); 