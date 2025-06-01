import SpeakingAssessmentTracker from '../models/speakingAssessmentTracker.model.js';
import User from '../models/user.model.js';

/**
 * Get all pending speaking assessments that need supervisor review
 */
export const getPendingSpeakingAssessments = async (req, res) => {
  try {
    // Only supervisors can access this endpoint
    if (req.user.role !== 'supervisor') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only supervisors can access this resource.'
      });
    }

    // Find all speaking assessments that have been submitted but not evaluated
    const pendingAssessments = await SpeakingAssessmentTracker.find({
      status: 'submitted',
      evaluatedAt: null
    }).populate('userId', 'fullName email username');

    return res.status(200).json({
      success: true,
      assessments: pendingAssessments
    });
  } catch (error) {
    console.error('Error getting pending speaking assessments:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get pending speaking assessments',
      error: error.message
    });
  }
};

/**
 * Get a specific speaking assessment by ID
 */
export const getSpeakingAssessmentById = async (req, res) => {
  try {
    const { id } = req.params;

    // Only supervisors or the user who owns the assessment can access it
    const assessment = await SpeakingAssessmentTracker.findById(id)
      .populate('userId', 'fullName email username');

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Speaking assessment not found'
      });
    }

    // Check if the user is authorized to view this assessment
    if (
      req.user.role !== 'supervisor' && 
      assessment.userId.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own assessments.'
      });
    }

    return res.status(200).json({
      success: true,
      assessment
    });
  } catch (error) {
    console.error('Error getting speaking assessment:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get speaking assessment',
      error: error.message
    });
  }
};

/**
 * Submit supervisor evaluation for a speaking assessment
 */
export const evaluateSpeakingAssessment = async (req, res) => {
  try {
    const { id } = req.params;
    const { score, feedback } = req.body;

    // Only supervisors can evaluate assessments
    if (req.user.role !== 'supervisor') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only supervisors can evaluate assessments.'
      });
    }

    // Validate input
    if (!score || score < 0 || score > 100) {
      return res.status(400).json({
        success: false,
        message: 'Invalid score. Score must be between 0 and 100.'
      });
    }

    // Find the assessment
    const assessment = await SpeakingAssessmentTracker.findById(id);

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Speaking assessment not found'
      });
    }

    // Update the assessment with evaluation details
    assessment.score = score;
    assessment.feedback = feedback;
    assessment.status = 'evaluated';
    assessment.evaluatedAt = new Date();
    assessment.evaluatedBy = req.user.id;

    await assessment.save();

    return res.status(200).json({
      success: true,
      message: 'Speaking assessment evaluated successfully',
      assessment
    });
  } catch (error) {
    console.error('Error evaluating speaking assessment:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to evaluate speaking assessment',
      error: error.message
    });
  }
}; 