// Route to get all speaking assessments for a user
router.get('/user/:userId', asyncHandler(async (req, res) => {
  try {
    const userId = req.params.userId;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    // Find all assessments for this user
    const assessments = await SpeakingAssessment.find({ userId })
      .sort({ createdAt: -1 }) // Most recent first
      .select('id userId language level taskId status score supervisorScore createdAt evaluatedAt');
    
    return res.status(200).json({
      success: true,
      assessments
    });
  } catch (error) {
    console.error('Error fetching user assessments:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching user assessments',
      error: error.message
    });
  }
})); 