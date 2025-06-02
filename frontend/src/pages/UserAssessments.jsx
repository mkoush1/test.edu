import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const UserAssessments = () => {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        setLoading(true);
        
        // Get the user ID from localStorage
        const userId = localStorage.getItem('userId') || 
                      sessionStorage.getItem('userId') || 
                      JSON.parse(localStorage.getItem('userData') || '{}')?.userId ||
                      JSON.parse(localStorage.getItem('userData') || '{}')?.UserID ||
                      localStorage.getItem('UserID');
        
        if (!userId) {
          setError('User ID not found. Please log in again.');
          setLoading(false);
          return;
        }

        // Import the assessment service
        const AssessmentService = (await import('../services/assessment.service')).default;
        
        // Fetch the user's assessments
        const response = await AssessmentService.getUserAssessments(userId);
        
        if (response.success && response.assessments) {
          setAssessments(response.assessments);
        } else {
          setError('Failed to load assessments');
        }
        
      } catch (err) {
        console.error('Error fetching assessments:', err);
        setError('An error occurred while fetching your assessments');
      } finally {
        setLoading(false);
      }
    };

    fetchAssessments();
  }, []);

  const handleViewAssessment = (assessment) => {
    // Store the assessment in session storage
    sessionStorage.setItem('viewingAssessment', JSON.stringify(assessment));
    
    // Navigate to the communication assessment page
    navigate('/communication-assessment');
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'evaluated':
        return (
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
            Evaluated
          </span>
        );
      case 'pending':
        return (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">
            Pending Review
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full font-medium">
            {status || 'Unknown'}
          </span>
        );
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#592538]"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-10">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 p-6 rounded-xl border border-red-200 text-center">
            <h2 className="text-xl font-bold text-red-700 mb-3">Error</h2>
            <p className="text-red-600">{error}</p>
            <button 
              onClick={() => navigate('/dashboard')}
              className="mt-6 px-5 py-2 bg-[#592538] text-white rounded-lg"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-10">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-block p-1.5 rounded-lg bg-[#592538] mb-4">
            <span className="text-white font-medium px-3 py-1">My Progress</span>
          </div>
          <h1 className="text-4xl font-bold text-center text-[#592538] mb-4">
            Your Assessment History
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto mb-8">
            View your past language assessments, check their status, and see your supervisor evaluations.
          </p>
          <div className="h-1 w-24 bg-gradient-to-r from-[#592538] to-[#6d2c44] mx-auto rounded-full"></div>
        </div>
        
        {assessments.length === 0 ? (
          <div className="bg-white p-8 rounded-xl shadow-md text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h2 className="text-xl font-bold text-gray-700 mb-2">No Assessments Found</h2>
            <p className="text-gray-500 mb-6">You haven't completed any assessments yet.</p>
            <button 
              onClick={() => navigate('/communication-assessment')}
              className="px-6 py-3 bg-gradient-to-r from-[#592538] to-[#6d2c44] text-white rounded-lg hover:shadow-lg transition-all duration-300"
            >
              Take Your First Assessment
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">Your Assessments</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {assessments.map((assessment) => (
                <div 
                  key={assessment.id} 
                  className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => handleViewAssessment(assessment)}
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="mb-4 md:mb-0">
                      <div className="flex items-center mb-2">
                        <h3 className="text-lg font-semibold text-gray-800 mr-3">
                          {assessment.language.charAt(0).toUpperCase() + assessment.language.slice(1)} - {assessment.level.toUpperCase()} Speaking Assessment
                        </h3>
                        {getStatusBadge(assessment.status)}
                      </div>
                      <p className="text-gray-600">
                        Task {assessment.taskId} • Completed on {formatDate(assessment.createdAt)}
                      </p>
                      {assessment.evaluatedAt && (
                        <p className="text-green-600 text-sm mt-1">
                          Evaluated on {formatDate(assessment.evaluatedAt)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center">
                      {assessment.status === 'evaluated' ? (
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mr-4">
                            <span className="text-xl font-bold text-green-700">{assessment.supervisorScore}/9</span>
                          </div>
                          <button 
                            className="px-4 py-2 bg-[#592538] text-white rounded-lg text-sm"
                          >
                            View Feedback
                          </button>
                        </div>
                      ) : (
                        <button 
                          className="px-4 py-2 border border-[#592538] text-[#592538] rounded-lg text-sm hover:bg-[#592538] hover:text-white transition-colors"
                        >
                          View Details
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex justify-center mt-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserAssessments; 