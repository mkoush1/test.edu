import React, { useState } from 'react';
import { Link } from 'react-router-dom';

/**
 * Simple Speaking Assessment Results component that matches the screenshot UI
 */
const SimpleSpeakingResults = ({ results, onBack }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentResults, setCurrentResults] = useState(results);
  
  // Format evaluation date - default to requested date if not available
  const formattedDate = currentResults?.evaluatedAt 
    ? new Date(currentResults.evaluatedAt).toLocaleDateString() 
    : '5/26/2025';
  
  // Use supervisor score from results if available, otherwise use 7/9 as requested
  const supervisorScore = currentResults?.supervisorScore ? currentResults.supervisorScore : 7;
  
  // Use supervisor feedback from results if available, otherwise use "goodjob" as requested
  const supervisorFeedback = currentResults?.supervisorFeedback ? currentResults.supervisorFeedback : 'goodjob';
  
  // Calculate percentage score based on supervisorScore (out of 9)
  const scorePercentage = Math.round((supervisorScore / 9) * 100);
  
  // Function to check for updates to the assessment
  const checkForUpdates = () => {
    if (!currentResults.assessmentId || isRefreshing) return;
    
    setIsRefreshing(true);
    
    // Import service dynamically
    import('../../services/assessment.service').then(module => {
      const AssessmentService = module.default;
      AssessmentService.getSpeakingAssessment(currentResults.assessmentId)
        .then(response => {
          if (response.success && response.assessment) {
            console.log('Refreshed assessment data:', response.assessment);
            // Create a new object that combines the current results with the new assessment data
            const updatedResults = {
              ...currentResults,
              ...response.assessment,
              supervisorFeedback: response.assessment.supervisorFeedback,
              supervisorScore: response.assessment.supervisorScore,
              status: response.assessment.status
            };
            setCurrentResults(updatedResults);
          }
          setIsRefreshing(false);
        })
        .catch(error => {
          console.error('Failed to refresh assessment:', error);
          setIsRefreshing(false);
        });
    });
  };

  // Render the "Assessment Pending Review" UI when status is pending
  if (currentResults?.status === 'pending' || currentResults?.pendingReview) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md">
        <div className="text-center p-6">
          <div className="flex justify-center mb-4">
            <div className="rounded-full h-16 w-16 flex items-center justify-center bg-blue-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          
          <h2 className="text-xl font-bold mb-4">Assessment Pending Review</h2>
          
          <p className="text-gray-600 mb-6">
            Your speaking assessment has been submitted and is waiting for supervisor review. You'll be notified once it's evaluated.
          </p>
          
          <button 
            onClick={onBack} 
            className="px-4 py-2 bg-[#592538] text-white rounded-lg hover:bg-[#6d2c44]"
          >
            Return to Assessments
          </button>
        </div>
      </div>
    );
  }
  
  // Render the detailed results when the assessment has been evaluated
  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="p-4 flex justify-between items-center">
        <h2 className="text-lg font-medium text-[#592538]">Speaking Assessment Results</h2>
        <button 
          onClick={onBack}
          className="px-3 py-1 text-xs bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
        >
          Back to Assessments
        </button>
      </div>
      
      {/* Assessment Info */}
      <div className="p-4 bg-gray-50 flex justify-between items-center border-t border-b border-gray-200">
        <div>
          <div className="font-medium text-gray-800">English - {currentResults?.level?.toUpperCase() || 'A2'} - Elementary</div>
          <div className="text-sm text-gray-600">Speaking Assessment</div>
        </div>
        
        <div className="text-2xl font-bold text-[#592538]">
          {scorePercentage}%
        </div>
      </div>

      {/* Results Content */}
      <div className="p-4">
        <h3 className="text-base font-medium mb-4">Assessment Results</h3>
        
        {/* Supervisor Evaluation */}
        <div className="mb-6 border border-green-200 rounded-lg bg-green-50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-medium text-green-800">Supervisor Evaluation</span>
          </div>
          
          <div className="flex items-start mb-4">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mr-4 border border-green-100 shadow-sm">
              <div className="text-lg font-bold text-[#592538]">{supervisorScore}/9</div>
            </div>
            
            <div>
              <div className="text-sm text-gray-700 font-medium">Expert Assessment</div>
              <div className="text-xs text-gray-500">Evaluated on {formattedDate}</div>
            </div>
          </div>
          
          <div className="border-t border-green-100 pt-3">
            <p className="text-gray-700">{supervisorFeedback}</p>
          </div>
        </div>

        {/* Check for updates button - only show for pending assessments */}
        {currentResults.status === 'pending' && currentResults.assessmentId && (
          <div className="mb-6 text-center">
            <button
              onClick={checkForUpdates}
              className="px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors flex items-center mx-auto"
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700 mr-2"></div>
                  Checking...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Check for Updates
                </>
              )}
            </button>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-6 flex justify-center">
          <Link 
            to="/dashboard"
            className="inline-flex items-center px-4 py-2 bg-[#592538] text-white rounded hover:bg-opacity-90"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SimpleSpeakingResults; 