import api from './api';

class CommunicationService {
  /**
   * Get aggregated communication assessment data for the current user
   * @returns {Promise<Object>} - Promise containing assessment data
   */
  async getAggregatedAssessments() {
    try {
      const response = await api.get('/communication/aggregate');
      return response.data;
    } catch (error) {
      // Return a simple error object instead of throwing
      return { 
        success: false,
        error: true,
        message: 'Unable to fetch assessment data'
      };
    }
  }

  /**
   * Submit communication assessment results
   * @param {Object} assessmentData - Assessment data to submit
   * @returns {Promise<Object>} - Promise containing submission result
   */
  async submitAssessment(assessmentData) {
    try {
      const response = await api.post('/communication/submit', assessmentData);
      return response.data;
    } catch (error) {
      // Return a simple error object instead of throwing
      return { 
        success: false,
        error: true,
        message: 'Unable to submit assessment data'
      };
    }
  }
}

export default new CommunicationService(); 