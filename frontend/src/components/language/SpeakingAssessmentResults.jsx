import React, { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import { Link } from 'react-router-dom';

// Add a TranscriptionDisplay component
const TranscriptionDisplay = ({ taskResults }) => {
  if (!taskResults || taskResults.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <h3 className="text-xl font-bold mb-3 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        Your Recording
      </h3>
      <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
        {taskResults.map((task, index) => (
          <div key={index} className="p-5">
            {task.recording && (
              <div className="mb-4">
                <div className="relative">
                  <video 
                    className="w-full rounded-lg border border-gray-200 shadow-sm" 
                    controls 
                    src={task.recording} 
                    poster="/assets/video-poster.png"
                  />
                  <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded-full">
                    Speaking Assessment
                  </div>
                </div>
              </div>
            )}
            
            {task.transcribedText && (
              <div>
                <div className="flex items-center mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  <h4 className="text-lg font-semibold">Transcription</h4>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{task.transcribedText}</p>
                </div>
                {task.wordCount && (
                  <div className="mt-2 text-sm text-gray-500 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                    Word count: {task.wordCount}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const SpeakingAssessmentResults = ({ results: initialResults, onBack }) => {
  const radarChartRef = useRef(null);
  const radarChartInstance = useRef(null);
  const [isMockData, setIsMockData] = useState(false);
  const [isRealAI, setIsRealAI] = useState(false);
  const [results, setResults] = useState(initialResults);
  const barChartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  
  // Parse supervisor feedback if it's a JSON string
  useEffect(() => {
    if (results?.supervisorFeedback && typeof results.supervisorFeedback === 'string') {
      try {
        // Try to parse the JSON string
        const parsedFeedback = JSON.parse(results.supervisorFeedback);
        console.log('Parsed supervisor feedback:', parsedFeedback);
        
        // Update the results with the parsed feedback
        setResults(prevResults => ({
          ...prevResults,
          parsedSupervisorFeedback: parsedFeedback,
          // Extract the overall feedback from the parsed object
          supervisorFeedbackText: parsedFeedback.overallFeedback || parsedFeedback,
          // Extract criteria if available
          supervisorCriteria: parsedFeedback.criteria || []
        }));
      } catch (error) {
        console.error('Error parsing supervisor feedback JSON:', error);
        // If parsing fails, use the string as is
        setResults(prevResults => ({
          ...prevResults,
          supervisorFeedbackText: results.supervisorFeedback
        }));
      }
    }
  }, [results?.supervisorFeedback]);

  // Update results when initialResults changes
  useEffect(() => {
    if (initialResults) {
      // Make sure type is set for consistent UI display
      if (!initialResults.type) {
        initialResults.type = 'speaking';
      }
      
      // Log the full results for debugging
      console.log('SpeakingAssessmentResults received:', initialResults);
      
      // Check if supervisorFeedback needs parsing
      if (initialResults.supervisorFeedback && typeof initialResults.supervisorFeedback === 'string') {
        try {
          const parsedFeedback = JSON.parse(initialResults.supervisorFeedback);
          initialResults.parsedSupervisorFeedback = parsedFeedback;
          initialResults.supervisorFeedbackText = parsedFeedback.overallFeedback || parsedFeedback;
          initialResults.supervisorCriteria = parsedFeedback.criteria || [];
          console.log('Parsed supervisor feedback during initialization:', parsedFeedback);
        } catch (error) {
          console.error('Error parsing supervisor feedback during initialization:', error);
        }
      }
      
      setResults(initialResults);
    }
  }, [initialResults]);

  useEffect(() => {
    if (!results) return;

    // Clean up previous chart instance
    if (radarChartInstance.current) {
      radarChartInstance.current.destroy();
    }

    // Log the full results for debugging
    console.log('SpeakingAssessmentResults received:', {
      results,
      type: results.type,
      assessmentId: results.assessmentId,
      status: results.status,
      hasSupervisorFeedback: !!results.supervisorFeedback,
      supervisorScore: results.supervisorScore,
      evaluatedAt: results.evaluatedAt,
      hasTaskResults: Array.isArray(results.taskResults) && results.taskResults.length > 0,
      score: results.score
    });
    
    // If the assessment has criteria, render the charts
    if (results.criteria && results.criteria.length > 0) {
      renderCharts();
    }

    // Check if this is mock data
    setIsMockData(results.isMockData || false);
    setIsRealAI(!results.isMockData && results.aiModel && results.aiModel.includes('OpenAI'));
    
    // Log the assessment ID to help with troubleshooting
    if (results.assessmentId) {
      console.log('Assessment ID available for loading supervisor feedback:', results.assessmentId);
    } else {
      console.warn('No assessment ID available, supervisor feedback cannot be loaded');
    }
    
    // If we don't have supervisor feedback but have an assessment ID, fetch the latest data
    const needToFetchDetails = (
      results.assessmentId && 
      (!results.supervisorFeedback || results.status === 'pending')
    );
    
    if (needToFetchDetails) {
      console.log('Fetching latest assessment data for ID:', results.assessmentId);
      
      // Import the service dynamically to avoid circular dependencies
      import('../../services/assessment.service').then(module => {
        const AssessmentService = module.default;
        AssessmentService.getSpeakingAssessment(results.assessmentId)
          .then(response => {
            if (response.success && response.assessment) {
              // Update the results with the latest assessment data
              console.log('Got updated assessment data:', response.assessment);
              
              // Create a new object that combines the current results with the new assessment data
              const updatedResults = {
                ...results,
                status: response.assessment.status,
                supervisorFeedback: response.assessment.supervisorFeedback,
                supervisorScore: response.assessment.supervisorScore,
                evaluatedAt: response.assessment.evaluatedAt,
                // Parse feedback if it's stored as a JSON string
                ...(response.assessment.feedback && typeof response.assessment.feedback === 'string' 
                  ? { criteria: JSON.parse(response.assessment.feedback).criteria || [] }
                  : {}),
                // Keep the original task results if available
                taskResults: results.taskResults || []
              };
              
              // If there's no videoUrl in current results but it exists in the response, add it
              if (!results.videoUrl && response.assessment.videoUrl) {
                updatedResults.taskResults = [{
                  recording: response.assessment.videoUrl,
                  transcribedText: response.assessment.transcribedText
                }];
              }
              
              // If there are criteria in the feedback, use them
              if (response.assessment.feedback && 
                  typeof response.assessment.feedback === 'string') {
                try {
                  const parsedFeedback = JSON.parse(response.assessment.feedback);
                  if (parsedFeedback.criteria && parsedFeedback.criteria.length > 0) {
                    updatedResults.criteria = parsedFeedback.criteria;
                    // Re-render charts with the new criteria
                    setTimeout(() => renderCharts(), 100);
                  }
                } catch (e) {
                  console.error('Error parsing feedback JSON:', e);
                }
              }
              
              // Update the local state
              setResults(updatedResults);
            }
          })
          .catch(error => {
            console.error('Failed to fetch updated assessment data:', error);
          });
      });
    }

    return () => {
      if (radarChartInstance.current) {
        radarChartInstance.current.destroy();
      }
    };
  }, [results]);

  const renderCharts = () => {
    if (!results || !radarChartRef.current) return;

    const backgroundColor = 'rgba(89, 37, 56, 0.2)';
    const borderColor = 'rgba(89, 37, 56, 1)';

    // Extract criteria names and scores
    const labels = results.criteria.map(criterion => criterion.name);
    const data = results.criteria.map(criterion => criterion.score);

    // Create radar chart
    const ctx = radarChartRef.current.getContext('2d');
    radarChartInstance.current = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Your Score',
          data: data,
          backgroundColor: backgroundColor,
          borderColor: borderColor,
          borderWidth: 2,
          pointBackgroundColor: borderColor,
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: borderColor
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            angleLines: {
              display: true,
              color: 'rgba(0, 0, 0, 0.1)'
            },
            suggestedMin: 0,
            suggestedMax: 9,
            ticks: {
              stepSize: 1,
              callback: function(value) {
                return value.toString();
              }
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `Score: ${context.raw}/9`;
              }
            }
          }
        }
      }
    });
  };

  const getScoreLevel = (score) => {
    if (score >= 90) return 'Expert';
    if (score >= 70) return 'Proficient';
    if (score >= 50) return 'Developing';
    return 'Novice';
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 70) return 'text-emerald-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  // Check assessment status and log for debugging
  const isPending = results?.status === 'pending';
  const isEvaluated = results?.status === 'evaluated';
  
  console.log('Assessment status check:', {
    status: results?.status,
    isPending,
    isEvaluated,
    hasSupervisorFeedback: !!results?.supervisorFeedback,
    supervisorScore: results?.supervisorScore
  });

  if (!results) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#592538]"></div>
      </div>
    );
  }

  // Safety check for missing properties to prevent errors
  if (!results.criteria || !Array.isArray(results.criteria) || results.criteria.length === 0) {
    console.warn('Assessment results missing criteria array, adding default values');
    results.criteria = [
      { name: 'Overall Speaking', score: 7, maxScore: 9, feedback: 'Your speaking skills show good proficiency.' }
    ];
  }
  
  if (typeof results.score !== 'number') {
    console.warn('Assessment results missing score, adding default value');
    results.score = 70; // Default score as percentage
  }

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white rounded-xl shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Speaking Assessment Results
        </h2>
        <div className="flex space-x-2">
          {results?.assessmentId && (
            <button
              onClick={() => {
                console.log('Refreshing assessment data for ID:', results.assessmentId);
                import('../../services/assessment.service').then(module => {
                  const AssessmentService = module.default;
                  AssessmentService.getSpeakingAssessment(results.assessmentId)
                    .then(response => {
                      if (response.success && response.assessment) {
                        console.log('Got refreshed assessment data:', response.assessment);
                        const updatedResults = {
                          ...results,
                          ...response.assessment,
                          supervisorFeedback: response.assessment.supervisorFeedback,
                          supervisorScore: response.assessment.supervisorScore,
                          status: response.assessment.status
                        };
                        setResults(updatedResults);
                      }
                    })
                    .catch(error => {
                      console.error('Failed to refresh assessment data:', error);
                    });
                });
              }}
              className="px-4 py-2 text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-50 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          )}
        <button 
          onClick={onBack}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
            Back to Assessment
        </button>
        </div>
      </div>

      {/* Status badge - Show if assessment is pending or evaluated */}
      {isPending && (
        <div className="mb-6 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
          <div className="flex items-start">
            <div className="mt-0.5 mr-3 text-yellow-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            <div>
              <h4 className="text-md font-semibold mb-1 text-yellow-800">
                Assessment Pending Review
              </h4>
              <p className="text-sm text-yellow-700">
                Your speaking assessment has been recorded and is awaiting review by a supervisor. The preliminary AI-generated feedback below will be supplemented with expert human feedback.
              </p>
            </div>
            </div>
          </div>
        )}
        
      {isEvaluated && results.supervisorFeedback && (
        <div className="mb-6 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
          <div className="flex items-start">
            <div className="mt-0.5 mr-3 text-green-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            </div>
            <div>
              <h4 className="text-md font-semibold mb-1 text-green-800">
                Assessment Evaluated by Supervisor
              </h4>
              <p className="text-sm text-green-700">
                Your speaking assessment has been reviewed by a language expert. See their feedback below.
              </p>
            </div>
          </div>
          </div>
        )}

      {/* Assessment source notice - Added at the top for visibility */}
      {results.aiModel && (
        <div className={`mb-6 p-4 rounded-lg border-2 ${isRealAI ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-start">
            <div className={`mt-0.5 mr-3 ${isRealAI ? 'text-blue-500' : 'text-red-500'}`}>
              {isRealAI ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <div>
              <h4 className={`text-md font-semibold mb-1 ${isRealAI ? 'text-blue-800' : 'text-red-800'}`}>
                {isRealAI ? 'Real-time AI Assessment' : 'Mock Assessment - No Real Analysis'}
              </h4>
              <p className={`text-sm ${isRealAI ? 'text-blue-700' : 'text-red-700'}`}>
                {isRealAI 
                  ? 'Your speaking has been analyzed in real-time by an advanced AI model designed specifically for language assessment. The feedback is personalized to your specific recording.' 
                  : 'This is a SAMPLE assessment using mock data. No real analysis of your speaking was performed. The AI service is currently unavailable. Please try again later.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Transcribed Speech */}
      <TranscriptionDisplay taskResults={results.taskResults} />

      {/* Score display */}
      <div className="mb-8">
        <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
          <div className="flex flex-col md:flex-row items-center">
            <div className="relative w-36 h-36 mb-4 md:mb-0 md:mr-6">
              <div className="w-full h-full rounded-full bg-gray-100 shadow-inner flex items-center justify-center overflow-hidden">
                <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t ${
                  results.supervisorScore >= 7 ? 'from-green-500' :
                  results.supervisorScore >= 5 ? 'from-blue-500' :
                  results.supervisorScore >= 3 ? 'from-yellow-500' : 'from-red-500'
                } to-transparent`} style={{ 
                  height: results.supervisorScore ? `${(results.supervisorScore / 9) * 100}%` : '0%',
                  transition: 'height 1s ease-out'
                }}></div>
                <div className="relative z-10 text-center">
                  <div className={`text-4xl font-bold ${getScoreColor(results.supervisorScore ? (results.supervisorScore * 11.1) : 0)}`}>
                    {results.supervisorScore ? `${results.supervisorScore}/9` : "-"}
                  </div>
                  {isPending && (
                    <div className="text-xs font-bold mt-1 px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full">
                      PENDING
                    </div>
                  )}
                  {isEvaluated && (
                    <div className="text-xs font-bold mt-1 px-2 py-0.5 bg-green-100 text-green-800 rounded-full">
                      FINAL
            </div>
            )}
          </div>
        </div>
              {results.supervisorScore && (
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">
                  <span className="text-sm font-medium">
                    {results.supervisorScore >= 7 ? 'Excellent' :
                     results.supervisorScore >= 5 ? 'Good' :
                     results.supervisorScore >= 3 ? 'Fair' : 'Needs Work'}
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-2xl font-bold mb-2 flex items-center justify-center md:justify-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>Assessment Score</span>
              </h3>
              <p className="text-gray-600 mb-3">
                {results.cefr ? 
                  `Based on the ${results.cefr.language} language standards for ${results.cefr.level.toUpperCase()} level (${results.cefr.description})` : 
                  'Based on standardized language assessment criteria'
                }
              </p>
              {/* Show competency level */}
              <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-2">
                {results.competencies && results.competencies.map((competency, index) => (
                  <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                    {competency}
                  </span>
                ))}
                {(!results.competencies || results.competencies.length === 0) && results.supervisorScore && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                    {getScoreLevel(results.supervisorScore * 11.1)}
              </span>
            )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Supervisor evaluation - displayed when available */}
      <div className="mb-8">
        <h3 className="text-xl font-bold mb-3 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Supervisor Evaluation
        </h3>
        
        {results.supervisorFeedback ? (
          <div className="bg-green-50 p-5 rounded-xl border border-green-200 mb-4">
            <div className="mb-4 flex items-center">
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mr-4 shadow-sm">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getScoreColor(results.supervisorScore * 11.1)}`}>
                    {results.supervisorScore}/9
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-800">Expert Assessment</h4>
                <p className="text-sm text-gray-600">
                  Evaluated on {results.evaluatedAt ? new Date(results.evaluatedAt).toLocaleDateString() : 'recent date'}
                </p>
              </div>
            </div>
            
            {/* Overall feedback */}
            <div className="bg-white p-4 rounded-lg border border-green-100 mb-4">
              <h5 className="font-semibold text-gray-800 mb-2">Overall Feedback:</h5>
              <p className="text-gray-700 whitespace-pre-wrap">
                {results.supervisorFeedbackText || 
                 (results.parsedSupervisorFeedback?.overallFeedback) || 
                 results.supervisorFeedback}
              </p>
            </div>
            
            {/* Display supervisor criteria if available */}
            {results.supervisorCriteria && results.supervisorCriteria.length > 0 && (
              <div className="mt-4">
                <h5 className="font-semibold text-gray-800 mb-2">Detailed Criteria Feedback:</h5>
                <div className="grid grid-cols-1 gap-3">
                  {results.supervisorCriteria.map((criterion, index) => (
                    <div key={index} className="bg-white p-4 rounded-lg border border-green-100">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-gray-800">{criterion.name}</span>
                        {criterion.score !== undefined && (
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-bold">
                            {criterion.score}/{criterion.maxScore || 20}
                          </span>
                        )}
                      </div>
                      
                      {/* Score Progress Bar */}
                      {criterion.score !== undefined && (
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-3">
                          <div 
                            className="h-2.5 rounded-full bg-green-500" 
                            style={{ 
                              width: `${(criterion.score / (criterion.maxScore || 20)) * 100}%`, 
                              transition: 'width 1s ease-out' 
                            }}
                          ></div>
                        </div>
                      )}
                      
                      {criterion.feedback && (
                        <p className="text-sm text-gray-600 mt-2">{criterion.feedback}</p>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Raw score display if available */}
                {results.parsedSupervisorFeedback?.rawScore && (
                  <div className="mt-4 bg-white p-4 rounded-lg border border-green-100">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-800">Total Score</span>
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-bold">
                        {results.parsedSupervisorFeedback.rawScore}/100
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Normalized to {results.parsedSupervisorFeedback.normalizedScore || results.supervisorScore}/9 for CEFR standards
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-yellow-50 p-5 rounded-xl border border-yellow-200 mb-4">
            <p className="text-yellow-700">
              Your assessment is pending supervisor evaluation. You'll receive detailed feedback once the review is complete.
            </p>
            <button 
              onClick={() => {
                if (results.assessmentId) {
                  console.log('Manually refreshing assessment data for ID:', results.assessmentId);
                  import('../../services/assessment.service').then(module => {
                    const AssessmentService = module.default;
                    AssessmentService.getSpeakingAssessment(results.assessmentId)
                      .then(response => {
                        if (response.success && response.assessment) {
                          console.log('Refreshed assessment data:', response.assessment);
                          // Create a new object that combines the current results with the new assessment data
                          const updatedResults = {
                            ...results,
                            ...response.assessment,
                            supervisorFeedback: response.assessment.supervisorFeedback,
                            supervisorScore: response.assessment.supervisorScore,
                            status: response.assessment.status
                          };
                          setResults(updatedResults);
                        }
                      })
                      .catch(error => {
                        console.error('Failed to refresh assessment data:', error);
                      });
                  });
                }
              }}
              className="mt-3 px-4 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-lg flex items-center mx-auto"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Check for Updates
            </button>
          </div>
        )}
      </div>

      {/* AI Criteria breakdown */}
      <div className="mb-8">
        <h3 className="text-xl font-bold mb-3 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
          Detailed Criteria
          {isPending && (
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
              Preliminary
              </span>
            )}
          </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {results.criteria && results.criteria.map((criterion, index) => {
            // Calculate score percentage for progress bar
            const scorePercentage = (criterion.score / 9) * 100;
            
            // Determine color based on score
            const getColorClass = (score) => {
              if (score >= 7) return 'bg-green-500';
              if (score >= 5) return 'bg-blue-500';
              if (score >= 3) return 'bg-yellow-500';
              return 'bg-red-500';
            };
            
            return (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-lg font-semibold text-gray-800">{criterion.name}</h4>
                    <div className="px-3 py-1 rounded-full text-white font-semibold" 
                         style={{ backgroundColor: criterion.score >= 7 ? '#10B981' : criterion.score >= 5 ? '#3B82F6' : criterion.score >= 3 ? '#F59E0B' : '#EF4444' }}>
                    {criterion.score}/9
                    </div>
                  </div>
                  
                  {/* Score Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mb-3">
                    <div className={`h-2.5 rounded-full ${getColorClass(criterion.score)}`} 
                         style={{ width: `${scorePercentage}%`, transition: 'width 1s ease-out' }}></div>
                  </div>
                  
                  {/* Verbal assessment */}
                  <div className="text-sm text-gray-500 mb-2">
                    {criterion.score >= 7 ? 'Excellent' : 
                     criterion.score >= 5 ? 'Good' : 
                     criterion.score >= 3 ? 'Needs improvement' : 
                     'Significant development needed'}
                  </div>
                </div>
                <div className="p-4 bg-gray-50">
                  <p className="text-gray-700">{criterion.feedback}</p>
                  
                  {/* Specific tips if available */}
                  {criterion.tips && criterion.tips.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Improvement Tips:</h5>
                      <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
                        {criterion.tips.map((tip, tipIndex) => (
                          <li key={tipIndex}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Radar Chart for visual comparison */}
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h4 className="text-lg font-semibold mb-4 text-center">Skills Comparison</h4>
          <div className="w-full h-64">
            <canvas ref={radarChartRef} className="mx-auto"></canvas>
          </div>
        </div>
      </div>

      {/* Overall Feedback */}
      <div className="mb-8">
        <h3 className="text-xl font-bold mb-3 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
          Overall Feedback
          {isPending && (
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
              Preliminary
            </span>
          )}
        </h3>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          {/* Quote design for feedback */}
          <div className="relative pl-6 border-l-4 border-indigo-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-100 absolute -top-4 -left-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
            </svg>
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed text-lg italic">{results.overallFeedback || results.feedback}</p>
          </div>
          
          {/* Key strengths and weaknesses summary if available */}
          {results.strengths && results.strengths.length > 0 && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                <h4 className="font-semibold text-green-800 mb-2 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Key Strengths
                </h4>
                <ul className="list-disc pl-5 text-green-700 space-y-1">
                  {results.strengths.map((strength, index) => (
                    <li key={index}>{strength}</li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                <h4 className="font-semibold text-amber-800 mb-2 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Areas to Improve
                </h4>
                <ul className="list-disc pl-5 text-amber-700 space-y-1">
                  {results.weaknesses && results.weaknesses.map((weakness, index) => (
                    <li key={index}>{weakness}</li>
            ))}
          </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recommendations */}
        <div className="mb-8">
        <h3 className="text-xl font-bold mb-3 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          Recommendations for Improvement
        </h3>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Description */}
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 border-b border-gray-200">
            <p className="text-gray-700">
              Based on your speaking assessment, here are personalized recommendations to help you improve your language skills.
            </p>
          </div>

          {/* Recommendations list */}
          <div className="divide-y divide-gray-100">
            {results.recommendations && results.recommendations.map((recommendation, index) => (
              <div key={index} className="p-4 flex items-start hover:bg-gray-50 transition-colors">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center mr-4 flex-shrink-0 mt-0.5">
                  <span className="text-indigo-600 font-semibold text-sm">{index + 1}</span>
                </div>
                <div>
                  <p className="text-gray-700 mb-2">{recommendation}</p>
                  
                  {/* Action button - could link to relevant resources */}
                  <button className="mt-1 text-sm text-indigo-600 hover:text-indigo-800 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Practice this skill
                  </button>
                </div>
                </div>
              ))}
            
            {/* If no recommendations are available */}
            {(!results.recommendations || results.recommendations.length === 0) && (
              <div className="p-6 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <p className="text-gray-500">No specific recommendations available yet. Check back after your assessment has been fully evaluated.</p>
              </div>
            )}
          </div>
          
          {/* Practice resources section */}
          <div className="bg-gray-50 p-4 border-t border-gray-200">
            <h4 className="font-medium text-gray-800 mb-2 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Additional Resources
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              <a href="#" className="flex items-center p-3 border border-gray-200 rounded-lg bg-white hover:bg-indigo-50 hover:border-indigo-200 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span className="text-gray-700">Speaking Practice Videos</span>
              </a>
              <a href="#" className="flex items-center p-3 border border-gray-200 rounded-lg bg-white hover:bg-indigo-50 hover:border-indigo-200 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="text-gray-700">Conversation Partners</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="flex flex-col sm:flex-row justify-center gap-4">
        <button
          onClick={onBack}
          className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 shadow-sm flex items-center justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Assessment
        </button>
        
        <Link
          to="/my-assessments"
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md flex items-center justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          Return to Dashboard
        </Link>
        
        <Link
          to="/speaking-practice"
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-md flex items-center justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Practice Speaking
        </Link>
      </div>
    </div>
  );
};

export default SpeakingAssessmentResults; 