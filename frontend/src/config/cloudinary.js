/**
 * Cloudinary configuration
 */

// Cloudinary configuration
export const CLOUDINARY_CONFIG = {
  cloud_name: 'dn79b1rvu',
  // No API key needed for unsigned uploads - handled by backend
  upload_preset: 'edusoft_unsigned', // This should be an unsigned upload preset configured in your Cloudinary account
  folder: 'speaking' // Base folder for speaking assessments
};

// Cloudinary upload URL
export const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloud_name}/auto/upload`;

// Helper function to get the folder path for a specific assessment
export const getSpeakingAssessmentFolder = (language, level, taskId) => {
  return `${CLOUDINARY_CONFIG.folder}/${language.toLowerCase()}/${level.toUpperCase()}/task${taskId}`;
}; 