import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Grid, Card, CardContent } from '@mui/material';
import api from '../services/api';

const AssessmentStatus = ({ userId, status: propStatus }) => {
  const [status, setStatus] = useState({
    availableAssessments: [],
    completedAssessments: [],
    totalAvailable: 0,
    totalCompleted: 0,
    progress: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('AssessmentStatus received props:', { propStatus, userId });
    
    if (propStatus) {
      console.log('Updating status from props:', propStatus);
      setStatus(propStatus);
      setLoading(false);
    } else {
      console.log('Fetching status from API');
      fetchAssessmentStatus();
    }
  }, [propStatus, userId]);

  const fetchAssessmentStatus = async () => {
    try {
      console.log('Fetching status for user:', userId);
      const response = await api.get(`/assessments/status/${userId}`);
      console.log('Status API response:', response.data);
      setStatus(response.data.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching status:', err);
      setError('Failed to fetch assessment status');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Progress Card */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Overall Progress
              </Typography>
              <Box display="flex" alignItems="center" gap={2}>
                <CircularProgress 
                  variant="determinate" 
                  value={status.progress} 
                  size={60}
                  thickness={4}
                />
                <Typography variant="h4">
                  {Math.round(status.progress)}%
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Available Assessments Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Available Assessments
              </Typography>
              <Typography variant="h4" color="primary">
                {status.totalAvailable}
              </Typography>
              <Box mt={2}>
                {status.availableAssessments.map((assessment) => (
                  <Typography key={assessment._id} variant="body2">
                    • {assessment.title}
                  </Typography>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Completed Assessments Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Completed Assessments
              </Typography>
              <Typography variant="h4" color="success.main">
                {status.totalCompleted}
              </Typography>
              <Box mt={2}>
                {status.completedAssessments.map((assessment, index) => (
                  <Typography key={index} variant="body2">
                    • {assessment.assessmentType} - {Math.round(assessment.score)}%
                  </Typography>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AssessmentStatus; 