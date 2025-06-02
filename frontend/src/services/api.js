import axios from 'axios';

const API_URL = 'http://localhost:5003/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: false, // Temporarily disable credentials
  timeout: 10000 // 10 second timeout
});

// Add token to requests if it exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('Request:', config);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('Response:', response);
    return response;
  },
  (error) => {
    console.error('Response error:', error);
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Error response:', error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error setting up request:', error.message);
    }
    return Promise.reject(error);
  }
);

export const authService = {
  // Unified login method
  login: async (credentials) => {
    try {
      // Try supervisor login first
      try {
        const response = await api.post('/auth/supervisor/login', credentials);
        console.log('Supervisor login response:', response.data);
        if (response.data.user) {
          response.data.user.role = 'supervisor'; // Ensure role is set
        }
        return response.data;
      } catch (supervisorError) {
        console.log('Supervisor login failed, trying user login');
        // If supervisor login fails, try user login
        const response = await api.post('/auth/user/login', credentials);
        console.log('User login response:', response.data);
        if (response.data.user) {
          response.data.user.role = 'user'; // Ensure role is set
        }
        return response.data;
      }
    } catch (error) {
      console.error('Login error:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
      throw error;
    }
  },

  // User authentication
  userSignup: async (userData) => {
    try {
      const response = await api.post('/auth/user/signup', {
        name: userData.name,
        email: userData.email,
        password: userData.password,
        role: userData.role || 'student'
      });
      return response.data;
    } catch (error) {
      console.error('User signup error:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
      throw error;
    }
  },

  userLogin: async (credentials) => {
    try {
      const response = await api.post('/auth/user/login', credentials);
      return response.data;
    } catch (error) {
      console.error('User login error:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
      throw error;
    }
  },

  // Supervisor authentication
  supervisorSignup: async (supervisorData) => {
    try {
      const response = await api.post('/auth/supervisor/signup', supervisorData);
      return response.data;
    } catch (error) {
      console.error('Supervisor signup error:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
      throw error;
    }
  },

  supervisorLogin: async (credentials) => {
    try {
      const response = await api.post('/auth/supervisor/login', credentials);
      return response.data;
    } catch (error) {
      console.error('Supervisor login error:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
      throw error;
    }
  },

  // Password reset
  forgotPassword: async (email, userType) => {
    try {
      // Validate email format before sending request
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error('Please enter a valid email address');
      }

      // Ensure userType is lowercase
      const normalizedUserType = userType.toLowerCase();

      const response = await api.post('/auth/forgot-password', {
        email: email.trim().toLowerCase(),
        userType: normalizedUserType
      });

      if (!response.data) {
        throw new Error('No response received from server');
      }

      return response.data;
    } catch (error) {
      console.error('Forgot password error:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('Failed to process password reset request. Please try again.');
      }
    }
  },

  resetPassword: async (token, newPassword, userType) => {
    try {
      // Ensure token is properly decoded
      const decodedToken = decodeURIComponent(token);

      const response = await api.post('/auth/reset-password', {
        token: decodedToken,
        password: newPassword,
        userType: userType.toLowerCase()
      });

      if (!response.data) {
        throw new Error('No response data received');
      }

      return response.data;
    } catch (error) {
      console.error('Reset password error:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('Error processing password reset request');
      }
    }
  },

  getCurrentUser: async () => {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      return null;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
  }
};

const userService = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
};

const supervisorService = {
  getSupervisors: () => api.get('/supervisors'),
  getSupervisor: (id) => api.get(`/supervisors/${id}`),
};

export const getAssessmentResults = async (assessmentType) => {
  if (assessmentType === 'leadership') {
    return api.get('/assessments/results/leadership');
  }
  return api.get(`/assessments/results/${assessmentType}`);
};

export const submitAssessment = async (assessmentType, answers) => {
  if (assessmentType === 'leadership') {
    return api.post('/assessments/submit/leadership', { answers });
  }
  return api.post(`/assessments/submit/${assessmentType}`, { answers });
};

// Export the signup function
export const signup = authService.userSignup;

export { userService, supervisorService };

export default api; 