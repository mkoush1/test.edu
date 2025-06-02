import api from './api';

class CloudinaryService {
  /**
   * Upload a video file to Cloudinary
   * @param {File} videoFile - The video file to upload
   * @param {Object} metadata - Additional metadata (language, level, taskId, userId)
   * @returns {Promise} - Promise resolving to the upload result
   */
  async uploadVideo(videoFile, metadata = {}) {
    try {
      // Create form data for upload
      const formData = new FormData();
      formData.append('video', videoFile);
      
      // Add metadata
      if (metadata.language) formData.append('language', metadata.language);
      if (metadata.level) formData.append('level', metadata.level);
      if (metadata.taskId) formData.append('taskId', metadata.taskId);
      if (metadata.userId) formData.append('userId', metadata.userId);
      
      // Upload to Cloudinary via our backend
      const response = await api.post('/cloudinary/upload-video', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error uploading video to Cloudinary:', error);
      throw error;
    }
  }
  
  /**
   * Delete a video from Cloudinary
   * @param {string} publicId - The public ID of the video to delete
   * @returns {Promise} - Promise resolving to the delete result
   */
  async deleteVideo(publicId) {
    try {
      const response = await api.post('/cloudinary/delete-video', { publicId });
      return response.data;
    } catch (error) {
      console.error('Error deleting video from Cloudinary:', error);
      throw error;
    }
  }
  
  /**
   * Convert a blob URL to a File object
   * @param {string} blobUrl - The blob URL to convert
   * @param {string} filename - The filename to use
   * @returns {Promise<File>} - Promise resolving to the File object
   */
  async blobUrlToFile(blobUrl, filename) {
    try {
      // Fetch the blob from the URL
      const response = await fetch(blobUrl);
      const blob = await response.blob();
      
      // Create a file from the blob
      return new File([blob], filename, { type: blob.type });
    } catch (error) {
      console.error('Error converting blob URL to file:', error);
      throw error;
    }
  }
}

export default new CloudinaryService(); 