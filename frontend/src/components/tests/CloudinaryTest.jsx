import React, { useState } from 'react';
import cloudinaryService from '../../services/cloudinary.service';

const CloudinaryTest = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setResult(null);

      const response = await cloudinaryService.uploadVideo(file, {
        language: 'english',
        level: 'b1',
        taskId: '1',
        userId: localStorage.getItem('userId') || 'test-user'
      });

      setResult(response);
      console.log('Upload successful:', response);
    } catch (err) {
      setError(err.message || 'Upload failed');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4">Cloudinary Upload Test</h2>
      
      <div className="mb-4">
        <label className="block text-gray-700 mb-2">Select Video File</label>
        <input 
          type="file" 
          accept="video/*"
          onChange={handleFileChange}
          className="w-full border border-gray-300 rounded p-2"
        />
      </div>
      
      <button
        onClick={handleUpload}
        disabled={uploading || !file}
        className={`w-full py-2 px-4 rounded ${
          uploading || !file ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'
        } text-white font-medium`}
      >
        {uploading ? 'Uploading...' : 'Upload to Cloudinary'}
      </button>
      
      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
          <p className="font-medium">Error</p>
          <p>{error}</p>
        </div>
      )}
      
      {result && (
        <div className="mt-4 p-3 bg-green-100 text-green-700 rounded">
          <p className="font-medium">Upload Successful</p>
          <p className="mt-2">Video URL: <a href={result.videoUrl} target="_blank" rel="noopener noreferrer" className="underline">{result.videoUrl}</a></p>
          <p>Public ID: {result.publicId}</p>
          
          {result.videoUrl && (
            <div className="mt-4">
              <video 
                src={result.videoUrl} 
                controls 
                className="w-full h-auto rounded"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CloudinaryTest; 