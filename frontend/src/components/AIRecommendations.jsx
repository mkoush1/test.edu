import React, { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * AI Recommendations Component
 * Displays personalized content recommendations for the user
 */
const AIRecommendations = ({ userId }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        // In production, replace with your actual API endpoint
        const response = await axios.get(`/api/recommendations/${userId}`);
        setRecommendations(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching recommendations:', err);
        setError('Failed to load recommendations');
        setLoading(false);
      }
    };

    if (userId) {
      fetchRecommendations();
    }
  }, [userId]);

  // Render loading state
  if (loading) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Personalized Recommendations
        </h3>
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Personalized Recommendations
        </h3>
        <div className="text-red-500 text-center py-4">{error}</div>
      </div>
    );
  }

  // Render empty state
  if (recommendations.length === 0) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Personalized Recommendations
        </h3>
        <p className="text-gray-600 text-center py-4">
          Complete more courses to get personalized recommendations.
        </p>
      </div>
    );
  }

  // Helper function to get icon based on content type
  const getContentTypeIcon = (type) => {
    switch (type) {
      case 'course':
        return '🎓';
      case 'book':
        return '📚';
      case 'video':
        return '🎬';
      case 'exercise':
        return '⚒️';
      default:
        return '📌';
    }
  };

  // Render recommendations
  return (
    <div className="p-4 bg-gray-50 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Personalized Recommendations
      </h3>
      <ul className="space-y-3">
        {recommendations.map((item, index) => (
          <li 
            key={index}
            className="p-3 bg-white rounded border border-gray-200 hover:bg-blue-50 transition-colors duration-200"
          >
            <div className="flex items-start">
              <span className="text-2xl mr-3">
                {getContentTypeIcon(item.type)}
              </span>
              <div>
                <h4 className="font-medium text-gray-800">{item.title}</h4>
                <div className="flex items-center mt-1">
                  <span className="text-sm text-gray-500 mr-2">Relevance:</span>
                  <div className="h-2 w-24 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500" 
                      style={{ width: `${Math.round(item.confidence * 100)}%` }}
                    ></div>
                  </div>
                  <span className="ml-2 text-xs text-gray-500">
                    {Math.round(item.confidence * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AIRecommendations; 