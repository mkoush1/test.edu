import api from './api';
import axios from 'axios';
import { API_URL } from '../config/constants';

class AssessmentService {
  // Get all available assessment types
  async getAssessmentTypes() {
    try {
      const response = await api.get(`/assessments`);
      return response.data;
    } catch (error) {
      console.error('Error fetching assessment types:', error);
      throw error;
    }
  }

  // Get user's assessment status
  async getUserAssessmentStatus(userId) {
    try {
      const response = await api.get(`/assessments/status/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching assessment status:', error);
      throw error;
    }
  }

  // Submit an assessment result
  async submitAssessment(assessmentData) {
    try {
      // Handle speaking assessments differently
      if (assessmentData.type === 'speaking') {
        const response = await api.post(`/speaking-assessment/evaluate`, assessmentData.data);
        return response.data;
      } 
      // Handle writing assessments
      else if (assessmentData.type === 'writing') {
        console.log('Submitting writing assessment to backend:', assessmentData);
        const response = await api.post(`/writing-assessment/submit-communication`, assessmentData);
        return response.data;
      } 
      // For other assessment types
      else {
        const response = await api.post(`/assessments/submit`, assessmentData);
        return response.data;
      }
    } catch (error) {
      console.error('Error submitting assessment:', error);
      throw error;
    }
  }
  
  // Get speaking assessment by ID
  async getSpeakingAssessment(assessmentId) {
    try {
      const response = await api.get(`/speaking-assessment/evaluated/${assessmentId}`);
      
      // Process the response to handle supervisor feedback
      if (response.data.success && response.data.assessment) {
        // Check if supervisorFeedback is a JSON string and parse it
        if (response.data.assessment.supervisorFeedback && 
            typeof response.data.assessment.supervisorFeedback === 'string') {
          try {
            const parsedFeedback = JSON.parse(response.data.assessment.supervisorFeedback);
            response.data.assessment.parsedSupervisorFeedback = parsedFeedback;
            response.data.assessment.supervisorFeedbackText = parsedFeedback.overallFeedback || 
              parsedFeedback.feedback || response.data.assessment.supervisorFeedback;
            
            // Extract criteria if available
            if (parsedFeedback.criteria && Array.isArray(parsedFeedback.criteria)) {
              response.data.assessment.supervisorCriteria = parsedFeedback.criteria;
            }
            
            console.log('Parsed supervisor feedback:', parsedFeedback);
          } catch (error) {
            console.error('Error parsing supervisor feedback JSON:', error);
            response.data.assessment.supervisorFeedbackText = response.data.assessment.supervisorFeedback;
          }
        }
        
        // Add user information if available
        if (response.data.assessment.userName || response.data.assessment.userEmail) {
          response.data.assessment.userInfo = {
            name: response.data.assessment.userName,
            email: response.data.assessment.userEmail
          };
        }
      }
      
      return response.data;
    } catch (error) {
      console.error('Error getting speaking assessment:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get speaking assessment'
      };
    }
  }
  
  // Get all speaking assessments for a user
  async getUserSpeakingAssessments(userId) {
    try {
      const response = await api.get(`/speaking-assessment/user/${userId || ''}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user speaking assessments:', error);
      throw error;
    }
  }
  
  // Check if a speaking assessment is completed
  async checkSpeakingAssessment(userId, language, level, taskId) {
    try {
      const response = await api.get(`/speaking-assessment/check`, {
        params: { userId, language, level, taskId }
      });
      
      console.log('Raw checkSpeakingAssessment response:', response.data);
      
      // Process the response to handle supervisor feedback
      if (response.data.success && response.data.assessment) {
        // Log the raw assessment data
        console.log('Raw assessment data in service:', response.data.assessment);
        
        // Make sure supervisorScore is properly handled
        if (response.data.assessment.supervisorScore !== undefined) {
          console.log('Found supervisor score:', response.data.assessment.supervisorScore);
        }
        
        // Check if supervisorFeedback is a JSON string and parse it
        if (response.data.assessment.supervisorFeedback && 
            typeof response.data.assessment.supervisorFeedback === 'string') {
          try {
            const parsedFeedback = JSON.parse(response.data.assessment.supervisorFeedback);
            response.data.assessment.parsedSupervisorFeedback = parsedFeedback;
            response.data.assessment.supervisorFeedbackText = parsedFeedback.overallFeedback || 
              parsedFeedback.feedback || response.data.assessment.supervisorFeedback;
            
            // Extract criteria if available
            if (parsedFeedback.criteria && Array.isArray(parsedFeedback.criteria)) {
              response.data.assessment.supervisorCriteria = parsedFeedback.criteria;
              console.log('Found supervisor criteria:', parsedFeedback.criteria.length);
            }
            
            console.log('Parsed supervisor feedback:', {
              hasOverallFeedback: !!parsedFeedback.overallFeedback,
              hasCriteria: Array.isArray(parsedFeedback.criteria),
              criteriaCount: Array.isArray(parsedFeedback.criteria) ? parsedFeedback.criteria.length : 0,
              rawScore: parsedFeedback.rawScore,
              normalizedScore: parsedFeedback.normalizedScore
            });
          } catch (error) {
            console.error('Error parsing supervisor feedback JSON:', error);
            response.data.assessment.supervisorFeedbackText = response.data.assessment.supervisorFeedback;
          }
        }
        
        // Add user information if available
        if (response.data.assessment.userName || response.data.assessment.userEmail) {
          response.data.assessment.userInfo = {
            name: response.data.assessment.userName,
            email: response.data.assessment.userEmail
          };
        }
      }
      
      return response.data;
    } catch (error) {
      console.error('Error checking speaking assessment:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to check speaking assessment'
      };
    }
  }

  // Get all writing assessments for a user
  async getUserWritingAssessments(userId) {
    try {
      const response = await api.get(`/writing-assessment/user/${userId || ''}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user writing assessments:', error);
      throw error;
    }
  }

  // Get writing assessment by ID
  async getWritingAssessment(assessmentId) {
    try {
      const response = await api.get(`/writing-assessment/${assessmentId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching writing assessment:', error);
      throw error;
    }
  }

  // Check if a user can take a writing assessment (not in cooldown period)
  async checkWritingAssessmentAvailability(level, language) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('User not authenticated');
      }
      
      const response = await axios.get(`${API_URL}/writing-assessment/check`, {
        params: { level, language },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return {
        success: true,
        available: response.data.canTakeAssessment,
        nextAvailableDate: response.data.nextAvailableDate,
        daysRemaining: response.data.daysRemaining,
        lastAssessment: response.data.lastAssessment,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error checking writing assessment availability:', error);
      throw error;
    }
  }

  // Check if a user can take a speaking assessment (not in cooldown period)
  async checkSpeakingAssessmentAvailability(language, level, taskId) {
    try {
      const response = await api.get(`/speaking-assessment/availability`, {
        params: { language, level, taskId }
      });
      return response.data;
    } catch (error) {
      console.error('Error checking speaking assessment availability:', error);
      // Default to false if there's an error
      return { success: false, available: false, error: error.message };
    }
  }

  // Get a user's writing assessment history
  async getUserWritingAssessments() {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('User not authenticated');
      }
      
      const response = await axios.get(`${API_URL}/writing-assessment/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return {
        success: true,
        assessments: response.data.assessments
      };
    } catch (error) {
      console.error('Error getting user writing assessments:', error);
      throw error;
    }
  }
}

export default new AssessmentService(); 