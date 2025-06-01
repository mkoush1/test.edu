import axios from 'axios';
import { getAuthToken } from '../utils/auth';

/**
 * Service for handling listening assessment API interactions
 */
class ListeningAssessmentService {
  constructor() {
    // Set base API URL - Use direct URL or Vite's import.meta.env
    this.apiUrl = `/api/listening-assessment`;
    console.log('ListeningAssessmentService using API URL:', this.apiUrl);
    
    // Set up axios instance with auth headers
    this.api = axios.create({
      baseURL: this.apiUrl,
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    // Add auth token to all requests
    this.api.interceptors.request.use((config) => {
      const token = getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
    
    console.log('ListeningAssessmentService initialized with API URL:', this.apiUrl);
  }

  /**
   * Submit a completed listening assessment
   * @param {Object} assessmentData - The completed assessment data
   * @returns {Promise<Object>} API response
   */
  async submitAssessment(assessmentData) {
    try {
      console.log('Submitting listening assessment:', assessmentData);
      const response = await this.api.post('/submit', assessmentData);
      console.log('Assessment submission response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error submitting assessment:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Check if a user can take a specific listening assessment
   * @param {string} level - CEFR level
   * @param {string} language - Language code
   * @returns {Promise<Object>} Availability status
   */
  async checkAssessmentAvailability(level, language) {
    try {
      console.log(`Checking listening assessment availability for ${language} level ${level}`);
      const response = await this.api.get(`/availability/${level}/${language}`);
      console.log('Availability check response:', response.data);
      
      // Ensure the return value has at least available flag set
      if (response.data && response.data.success) {
        return {
          available: response.data.available || false,
          message: response.data.message || 'No message provided',
          nextAvailableDate: response.data.nextAvailableDate ? new Date(response.data.nextAvailableDate) : null,
          previousScore: response.data.previousScore,
          previousAssessment: response.data.previousAssessment
        };
      } else {
        // Default fallback if response doesn't match expected format
        return {
          available: false,
          message: 'Error checking availability. Please try again later.',
          nextAvailableDate: new Date(Date.now() + 60000) // 1 minute cooldown
        };
      }
    } catch (error) {
      console.error('Error checking assessment availability:', error.response?.data || error.message);
      // Default fallback on error
      return {
        available: false,
        message: 'Error checking availability. Please try again later.',
        nextAvailableDate: new Date(Date.now() + 60000) // 1 minute cooldown
      };
    }
  }

  /**
   * Get user's listening assessment history
   * @param {string} userId - Optional user ID (if not provided, current user is used)
   * @returns {Promise<Object>} Assessment history
   */
  async getUserAssessments(userId = null) {
    try {
      const url = userId ? `/user/${userId}` : '/user';
      console.log(`Getting listening assessments for ${userId ? 'user ' + userId : 'current user'}`);
      
      const response = await this.api.get(url);
      console.log('User assessments response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error getting user assessments:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get a specific listening assessment by ID
   * @param {string} assessmentId - Assessment ID
   * @returns {Promise<Object>} Assessment data
   */
  async getAssessmentById(assessmentId) {
    try {
      console.log(`Getting listening assessment with ID: ${assessmentId}`);
      const response = await this.api.get(`/${assessmentId}`);
      console.log('Assessment response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error getting assessment by ID:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get listening assessment statistics for a user
   * @param {string} userId - Optional user ID (if not provided, current user is used)
   * @returns {Promise<Object>} Assessment statistics
   */
  async getUserStatistics(userId = null) {
    try {
      const url = userId ? `/statistics/user/${userId}` : '/statistics/user';
      console.log(`Getting listening assessment statistics for ${userId ? 'user ' + userId : 'current user'}`);
      
      const response = await this.api.get(url);
      console.log('User statistics response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error getting user statistics:', error.response?.data || error.message);
      throw error;
    }
  }
}

// Export a singleton instance
export default new ListeningAssessmentService(); 