import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const SpeakingAssessmentReview = () => {
  // Default criteria with initial scores
  const defaultCriteria = [
    { name: 'Pronunciation', score: 14, feedback: '' },
    { name: 'Fluency', score: 14, feedback: '' },
    { name: 'Coherence', score: 14, feedback: '' },
    { name: 'Grammar', score: 14, feedback: '' },
    { name: 'Vocabulary', score: 14, feedback: '' }
  ];
  
  // Calculate initial total score
  const initialTotalScore = defaultCriteria.reduce((sum, criterion) => sum + parseInt(criterion.score || 0), 0);
  
  const [pendingAssessments, setPendingAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [evaluationForm, setEvaluationForm] = useState({
    score: initialTotalScore,
    feedback: '',
    criteria: defaultCriteria
  });
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  const navigate = useNavigate();
  
  // Get supervisor ID from multiple possible sources
  const getSupervisorId = () => {
    const directId = localStorage.getItem('supervisorId') || sessionStorage.getItem('userId');
    
    // Try to get from userData object
    let fromUserData = null;
    try {
      const userData = localStorage.getItem('userData');
      if (userData) {
        const parsed = JSON.parse(userData);
        fromUserData = parsed.supervisorId || parsed.UserID || parsed.userId || parsed._id;
      }
    } catch (e) {
      console.error('Error parsing userData:', e);
    }
    
    // Try to get from supervisor data object
    let fromSupervisorData = null;
    try {
      const supervisorData = localStorage.getItem('supervisorData');
      if (supervisorData) {
        const parsed = JSON.parse(supervisorData);
        fromSupervisorData = parsed.supervisorId || parsed.UserID || parsed._id;
      }
    } catch (e) {
      console.error('Error parsing supervisorData:', e);
    }
    
    // In development mode, if no ID found, use a fallback ID
    const id = directId || fromUserData || fromSupervisorData || 
               (process.env.NODE_ENV === 'development' ? 'test_supervisor_123' : 'unknown_supervisor');
    
    console.log('Resolved supervisor ID:', id);
    
    // Store for future use
    if (id && id !== 'unknown_supervisor') {
      localStorage.setItem('supervisorId', id);
    }
    
    return id;
  };
  
  // Assign supervisor ID using the function
  const supervisorId = getSupervisorId();
  
  // Get pending assessments when component mounts
  useEffect(() => {
    fetchPendingAssessments();
  }, []);
  
  // Fetch pending assessments
  const fetchPendingAssessments = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching pending assessments...');
      
      const response = await axios.get('/api/speaking-assessment/pending');
      
      console.log('Pending assessments response:', response.data);
      
      if (response.data.success) {
        // Log user info for debugging
        if (response.data.assessments && response.data.assessments.length > 0) {
          response.data.assessments.forEach((assessment, index) => {
            console.log(`Assessment ${index} user info:`, {
              userId: assessment.userId,
              userInfo: assessment.userInfo,
              name: assessment.userInfo?.name || 'Not available'
            });
          });
        }
        
        setPendingAssessments(response.data.assessments);
      } else {
        setError(response.data.message || 'Failed to fetch pending assessments');
      }
    } catch (error) {
      console.error('Error fetching pending assessments:', error);
      setError('Failed to load pending assessments. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  // View a specific assessment
  const viewAssessment = async (assessment) => {
    console.log('Selected assessment:', assessment);
    setSelectedAssessment(assessment);
    
    // Reset evaluation form with default criteria
    const freshCriteria = [...defaultCriteria];
    
    // Calculate total score as sum of all criteria
    const totalScore = freshCriteria.reduce((sum, criterion) => sum + parseInt(criterion.score || 0), 0);
    
    setEvaluationForm({
      score: totalScore,
      feedback: '',
      criteria: freshCriteria
    });
    
    // Clear any previous success message
    setSuccessMessage('');
  };
  
  // Handle changes in evaluation form
  const handleEvaluationChange = (e) => {
    const { name, value } = e.target;
    
    // Don't allow direct changes to the score field
    if (name === 'score') return;
    
    setEvaluationForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle changes in criteria scores
  const handleCriteriaChange = (index, field, value) => {
    setEvaluationForm(prev => {
      const updatedCriteria = [...prev.criteria];
      updatedCriteria[index] = {
        ...updatedCriteria[index],
        [field]: value
      };
      
      // If it's a score change, update the overall score as the sum of all criteria scores
      if (field === 'score') {
        const totalScore = updatedCriteria.reduce((sum, criterion) => sum + parseInt(criterion.score || 0), 0);
        
        return {
          ...prev,
          criteria: updatedCriteria,
          score: totalScore
        };
      }
      
      return {
        ...prev,
        criteria: updatedCriteria
      };
    });
  };
  
  // Submit evaluation
  const submitEvaluation = async () => {
    try {
      setSubmitting(true);
      setError(null);
      
      // Validate form
      if (!evaluationForm.feedback.trim()) {
        setError('Please provide feedback for the student');
        setSubmitting(false);
        return;
      }
      
      // Validate that all criteria have valid scores
      for (const criterion of evaluationForm.criteria) {
        if (!criterion.score || criterion.score < 0 || criterion.score > 20) {
          setError(`Please provide a valid score (0-20) for ${criterion.name}`);
          setSubmitting(false);
          return;
        }
      }
      
      // Get supervisor ID
      const supervisorId = getSupervisorId();
      
      if (!supervisorId || supervisorId === 'unknown_supervisor') {
        setError('Supervisor ID not found. Please log in again.');
        setSubmitting(false);
        return;
      }
      
      // Recalculate the total score to ensure it's accurate
      // Each criterion is out of 20, so calculate the total out of 100
      const maxTotalScore = evaluationForm.criteria.length * 20;
      const actualTotalScore = evaluationForm.criteria.reduce(
        (sum, criterion) => sum + parseInt(criterion.score || 0), 
        0
      );
      
      // Calculate the final score as a percentage (out of 100)
      const finalScore = Math.round((actualTotalScore / maxTotalScore) * 100);
      
      // Ensure assessment ID is valid
      if (!selectedAssessment.id || !selectedAssessment.id.match(/^[0-9a-fA-F]{24}$/)) {
        console.warn('Assessment ID may not be a valid MongoDB ObjectId:', selectedAssessment.id);
        setError('Invalid assessment ID format. Please refresh and try again.');
        setSubmitting(false);
        return;
      }
      
      // Prepare submission data
      const submissionData = {
        supervisorId,
        score: finalScore,
        feedback: evaluationForm.feedback,
        criteria: evaluationForm.criteria.map(c => ({
          name: c.name,
          score: parseInt(c.score),
          feedback: c.feedback || ''
        }))
      };
      
      console.log('Submitting evaluation:', {
        assessmentId: selectedAssessment.id,
        supervisorId,
        score: finalScore,
        feedbackLength: evaluationForm.feedback.length,
        criteriaCount: evaluationForm.criteria.length,
        actualTotalScore,
        maxTotalScore
      });
      
      // Submit evaluation with the calculated score
      const response = await axios.post(
        `/api/speaking-assessment/evaluate/${selectedAssessment.id}`,
        submissionData
      );
      
      console.log('Evaluation submission response:', response.data);
      
      if (response.data.success) {
        setSuccessMessage('Assessment evaluated successfully!');
        
        // Remove the evaluated assessment from the pending list
        setPendingAssessments(prev => 
          prev.filter(assessment => assessment.id !== selectedAssessment.id)
        );
        
        // Clear selected assessment after a delay
        setTimeout(() => {
          setSelectedAssessment(null);
        }, 2000);
        
        // Refresh the list after a short delay to ensure consistency
        setTimeout(() => {
          fetchPendingAssessments();
        }, 3000);
      } else {
        setError(response.data.message || 'Failed to submit evaluation');
      }
    } catch (error) {
      console.error('Error submitting evaluation:', error);
      
      // If there's a specific MongoDB ID error, show a more helpful message
      if (error.response?.status === 400 && error.response?.data?.message?.includes('Invalid assessment ID')) {
        setError('The assessment ID appears to be invalid. Please refresh the page and try again.');
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError('Failed to submit evaluation. Please try again later.');
      }
    } finally {
      setSubmitting(false);
    }
  };
  
  // Format date to readable string
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };
  
  // Go back to supervisor dashboard
  const goToDashboard = () => {
    navigate('/supervisor-dashboard');
  };
  
  // Helper function to get user display name
  const getUserDisplayName = (assessment) => {
    if (assessment?.userInfo?.name) {
      return assessment.userInfo.name;
    }
    
    if (assessment?.userId?.fullName) {
      return assessment.userId.fullName;
    }
    
    if (assessment?.userId?.username) {
      return assessment.userId.username;
    }
    
    if (typeof assessment?.userId === 'string' && assessment.userId.includes('@')) {
      return assessment.userId; // It's likely an email
    }
    
    return assessment?.userId || 'Unknown User';
  };
  
  // Render criteria input fields
  const renderCriteriaInputs = () => {
    return evaluationForm.criteria.map((criterion, index) => (
      <div key={index} className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h4 className="text-lg font-medium text-gray-800 mb-2">{criterion.name}</h4>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Score (0-20)
          </label>
          <div className="flex items-center">
            <input
              type="range"
              min="0"
              max="20"
              value={criterion.score}
              onChange={(e) => handleCriteriaChange(index, 'score', e.target.value)}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <span className="ml-4 text-lg font-bold text-indigo-700 min-w-[3rem] text-center">
              {criterion.score}/20
            </span>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Feedback (Optional)
          </label>
          <textarea
            value={criterion.feedback || ''}
            onChange={(e) => handleCriteriaChange(index, 'feedback', e.target.value)}
            placeholder={`Provide specific feedback for ${criterion.name.toLowerCase()}`}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            rows="2"
          />
        </div>
      </div>
    ));
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold">Speaking Assessment Review</h1>
              </div>
            </div>
            <div className="flex items-center">
              <button
                onClick={goToDashboard}
                className="ml-4 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row">
              {/* Left panel - Assessment list */}
              <div className={`w-full md:w-2/5 pr-0 md:pr-6 ${selectedAssessment ? 'hidden md:block' : ''}`}>
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                  <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                    <h2 className="text-lg font-medium text-gray-900">
                      Pending Assessments ({pendingAssessments.length})
                    </h2>
                  </div>
                  
                  {pendingAssessments.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="mt-2">No pending assessments to review</p>
                      <button 
                        onClick={fetchPendingAssessments} 
                        className="mt-4 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200"
                      >
                        Refresh List
                      </button>
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-200">
                      {pendingAssessments.map((assessment) => (
                        <li key={assessment.id}>
                          <button
                            onClick={() => viewAssessment(assessment)}
                            className={`block hover:bg-gray-50 w-full text-left ${selectedAssessment?.id === assessment.id ? 'bg-indigo-50 border-l-4 border-indigo-500' : ''}`}
                          >
                            <div className="px-4 py-4 sm:px-6">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-indigo-600 truncate">
                                  {getUserDisplayName(assessment)}
                                </p>
                                <div className="ml-2 flex-shrink-0 flex">
                                  <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                    {assessment.level?.toUpperCase()} - {assessment.language?.charAt(0).toUpperCase() + assessment.language?.slice(1)}
                                  </p>
                                </div>
                              </div>
                              <div className="mt-2 sm:flex sm:justify-between">
                                <div className="sm:flex">
                                  <p className="flex items-center text-sm text-gray-500">
                                    <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                    </svg>
                                    Submitted: {formatDate(assessment.createdAt)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              
              {/* Right panel - Assessment details */}
              {selectedAssessment && (
                <div className="w-full md:w-3/5 mt-6 md:mt-0">
                  <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex justify-between items-center">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Assessment Details
                      </h3>
                      <button
                        onClick={() => setSelectedAssessment(null)}
                        className="md:hidden text-gray-400 hover:text-gray-500"
                      >
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    
                    {successMessage && (
                      <div className="bg-green-50 border-l-4 border-green-400 p-4 m-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-green-700">{successMessage}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="px-4 py-5 sm:px-6">
                      <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                        <div className="sm:col-span-1">
                          <dt className="text-sm font-medium text-gray-500">Student</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {getUserDisplayName(selectedAssessment)}
                            {selectedAssessment.userInfo?.email && (
                              <span className="block text-xs text-gray-500 mt-1">{selectedAssessment.userInfo.email}</span>
                            )}
                          </dd>
                        </div>
                        
                        <div className="sm:col-span-1">
                          <dt className="text-sm font-medium text-gray-500">Level</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {selectedAssessment.level?.toUpperCase()} - {selectedAssessment.language?.charAt(0).toUpperCase() + selectedAssessment.language?.slice(1)}
                          </dd>
                        </div>
                        
                        <div className="sm:col-span-1">
                          <dt className="text-sm font-medium text-gray-500">Submitted</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {formatDate(selectedAssessment.createdAt)}
                          </dd>
                        </div>
                        
                        <div className="sm:col-span-1">
                          <dt className="text-sm font-medium text-gray-500">Status</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                              {selectedAssessment.status?.charAt(0).toUpperCase() + selectedAssessment.status?.slice(1) || 'Pending'}
                            </span>
                          </dd>
                        </div>
                        
                        <div className="sm:col-span-2">
                          <dt className="text-sm font-medium text-gray-500">Prompt</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {selectedAssessment.prompt || 'Speaking assessment task'}
                          </dd>
                        </div>
                      </dl>
                    </div>
                    
                    {/* Video player */}
                    <div className="px-4 py-5 sm:px-6">
                      <h4 className="text-base font-medium text-gray-900 mb-2">Student's Response</h4>
                      <div className="aspect-w-16 aspect-h-9 bg-gray-100 rounded-lg overflow-hidden">
                        <video
                          src={selectedAssessment.videoUrl}
                          controls
                          className="w-full h-full object-contain"
                        />
                      </div>
                      
                      {/* Transcribed text */}
                      {selectedAssessment.transcribedText && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-1">Transcribed Speech:</h4>
                          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <p className="text-gray-700 whitespace-pre-wrap">{selectedAssessment.transcribedText}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* AI Assessment */}
                    {selectedAssessment.feedback && (
                      <div className="px-4 py-5 sm:px-6 border-t border-gray-200">
                        <h4 className="text-base font-medium text-gray-900 mb-2">AI Assessment</h4>
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                          <div className="flex items-center mb-3">
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mr-3 shadow-sm">
                              <span className="text-xl font-bold text-blue-600">{selectedAssessment.score}%</span>
                            </div>
                            <div>
                              <p className="text-sm text-blue-700">Preliminary AI Score</p>
                            </div>
                          </div>
                          
                          {selectedAssessment.feedback.criteria && (
                            <div className="mb-3">
                              <h5 className="font-medium text-sm mb-2 text-blue-800">Criteria Scores:</h5>
                              <ul className="space-y-1 text-sm text-blue-700">
                                {selectedAssessment.feedback.criteria.map((criterion, index) => (
                                  <li key={index} className="flex justify-between">
                                    <span>{criterion.name}:</span>
                                    <span className="font-semibold">{criterion.score}/{criterion.maxScore || 9}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {selectedAssessment.feedback.overallFeedback && (
                            <div>
                              <h5 className="font-medium text-sm mb-1 text-blue-800">Overall Feedback:</h5>
                              <p className="text-sm text-blue-700">{selectedAssessment.feedback.overallFeedback}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Evaluation form */}
                    <div className="px-4 py-5 sm:px-6 bg-gray-50 border-t border-gray-200">
                      <h4 className="text-base font-medium text-gray-900 mb-4">Evaluate Speaking Assessment</h4>
                      
                      {/* Overall score - now read-only display */}
                      <div className="mb-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-medium text-gray-800">Overall Score</h3>
                          <div className="text-3xl font-bold text-indigo-700">
                            {evaluationForm.score}/100
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                          This score is automatically calculated as the sum of all criteria scores below.
                        </p>
                      </div>
                      
                      {/* Criteria evaluations */}
                      <h5 className="text-sm font-medium text-gray-700 mb-3">Assessment Criteria</h5>
                      {renderCriteriaInputs()}
                      
                      {/* Overall feedback */}
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Overall Feedback
                        </label>
                        <textarea
                          name="feedback"
                          value={evaluationForm.feedback}
                          onChange={handleEvaluationChange}
                          placeholder="Provide comprehensive feedback for the student about their speaking performance"
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                          rows="4"
                          required
                        />
                      </div>
                      
                      {/* Submit button */}
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={submitEvaluation}
                          disabled={submitting}
                          className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed`}
                        >
                          {submitting ? (
                            <>
                              <span className="animate-spin -ml-1 mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></span>
                              Submitting...
                            </>
                          ) : (
                            'Submit Evaluation'
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default SpeakingAssessmentReview; 