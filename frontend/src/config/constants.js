// Global constants for the application

// API URL configuration - prioritize environment variable, then fallback to defaults
export const API_URL = import.meta.env.VITE_API_URL || window.location.origin + '/api' || 'http://localhost:5003/api';

// Assessment types
export const ASSESSMENT_TYPES = {
  WRITING: 'writing',
  SPEAKING: 'speaking',
  READING: 'reading',
  LISTENING: 'listening'
};

// CEFR levels
export const CEFR_LEVELS = {
  A1: 'a1',
  A2: 'a2',
  B1: 'b1',
  B2: 'b2',
  C1: 'c1',
  C2: 'c2'
};

// Languages
export const LANGUAGES = {
  ENGLISH: 'english',
  FRENCH: 'french'
}; 