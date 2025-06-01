import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LanguageResults = ({ results, language, level, onBack }) => {
  const navigate = useNavigate();
  const [expandedTask, setExpandedTask] = useState(null);

  // A1 voicemail message transcript
  const a1VoicemailTranscript = `John: Hi, this is John. Thanks for calling. I'm not here at the moment, so please leave a
message and I'll call you back.
Marina: Hi, John, this is Marina Silva calling from Old Time Toys. Your colleague Alex gave me
your phone number. She said you can help me.
I need some information on your new products. Could you please call me when you are back
in the office? My phone number is 0-2-0-8, 6-5-5-7-6-2-1.
Also, can you please email me your new brochure and information about your prices? My
email address is Marina, that's M-A-R-I-N-A, dot Silva, that's S-I-L-V-A, at O-L-D-T-I-M-E hyphen
toys dot com.
Thanks a lot. I look forward to hearing from you.`;

  // Check if this is the A1 voicemail message assessment
  const isA1Voicemail = results.type === 'listening' && 
                        level?.id === 'a1' && 
                        results.discussionAnswer !== undefined;

  // Check if we have AI writing assessment results
  const hasAiEvaluation = results.type === 'writing' && 
                         results.tasks?.some(task => task.aiEvaluation);

  const getLevelColor = (level) => {
    const colors = {
      'a1': 'bg-green-100 text-green-800',
      'a2': 'bg-green-200 text-green-800',
      'b1': 'bg-blue-100 text-blue-800',
      'b2': 'bg-blue-200 text-blue-800',
      'c1': 'bg-purple-100 text-purple-800',
      'c2': 'bg-purple-200 text-purple-800',
      'pre-a1': 'bg-yellow-100 text-yellow-800'
    };
    return colors[level] || 'bg-gray-100 text-gray-800';
  };

  const getSkillIcon = (type) => {
    switch (type) {
      case 'reading':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        );
      case 'writing':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        );
      case 'listening':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        );
      case 'speaking':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        );
    }
  };

  const renderScoreRing = (score) => {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;
    const strokeDasharray = `${circumference} ${circumference}`;
    const strokeDashoffset = offset;

    let strokeColor = '#e5e7eb'; // Default gray
    if (score >= 80) strokeColor = '#059669'; // Green for high score
    else if (score >= 60) strokeColor = '#3b82f6'; // Blue for medium score
    else if (score >= 40) strokeColor = '#f59e0b'; // Yellow for low score
    else strokeColor = '#ef4444'; // Red for very low score

    return (
      <div className="relative inline-flex items-center justify-center">
        <svg className="w-32 h-32">
          <circle
            className="text-gray-200"
            strokeWidth="8"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx="64"
            cy="64"
          />
          <circle
            className="transition-all duration-1000 ease-in-out"
            strokeWidth="8"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            stroke={strokeColor}
            fill="transparent"
            r={radius}
            cx="64"
            cy="64"
            style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
          />
        </svg>
        <span className="absolute text-3xl font-bold text-gray-700">{Math.round(score)}%</span>
      </div>
    );
  };

  const getCriteriaScoreColor = (score) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-blue-600';
    if (score >= 4) return 'text-yellow-600';
    return 'text-red-600';
  };

  const renderAIWritingAssessment = (task, index) => {
    const aiEvaluation = task.aiEvaluation;
    if (!aiEvaluation) return null;

    const isExpanded = expandedTask === index;
    
    return (
      <div className="mt-4 border border-gray-200 rounded-lg p-4 bg-gray-50">
        <div className="flex justify-between items-center cursor-pointer" onClick={() => setExpandedTask(isExpanded ? null : index)}>
          <h4 className="font-medium text-[#592538] flex items-center">
            AI Writing Assessment
            <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">AI-Powered</span>
          </h4>
          <button className="text-gray-500 hover:text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform ${isExpanded ? 'transform rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        {isExpanded && (
          <div className="mt-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {aiEvaluation.criteria.map((criterion, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-3 bg-white">
                  <div className="flex justify-between mb-1">
                    <span className="font-medium text-gray-700">{criterion.name}</span>
                    <span className={`font-semibold ${getCriteriaScoreColor(criterion.score)}`}>
                      {criterion.score}/10
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{criterion.feedback}</p>
                </div>
              ))}
            </div>
            
            <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
              <h5 className="font-medium text-gray-700 mb-2">Overall Feedback</h5>
              <p className="text-sm text-gray-600">{aiEvaluation.overallFeedback}</p>
            </div>
            
            <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
              <h5 className="font-medium text-gray-700 mb-2">Recommendations for Improvement</h5>
              <ul className="list-disc pl-5 space-y-1">
                {aiEvaluation.recommendations && aiEvaluation.recommendations.length > 0 ? (
                  <>
                    {aiEvaluation.isAiGenerated && (
                      <div className="mb-2 text-xs text-blue-600 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        AI-Generated Recommendations
                      </div>
                    )}
                    {aiEvaluation.recommendations.map((rec, idx) => (
                      <li key={idx} className="text-sm text-gray-600">{rec}</li>
                    ))}
                  </>
                ) : (
                  <>
                    <div className="mb-2 text-xs text-gray-500 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Standard Recommendations
                    </div>
                    <ul className="list-disc pl-5 space-y-1">
                      <li className="text-sm text-gray-600">Focus on basic sentence structure and grammar rules.</li>
                      <li className="text-sm text-gray-600">Practice writing short paragraphs that directly address the prompt.</li>
                      <li className="text-sm text-gray-600">Build vocabulary related to common topics in this level.</li>
                    </ul>
                  </>
                )}
              </ul>
            </div>
            
            <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
              <h5 className="font-medium text-gray-700 mb-2">Your Response</h5>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{task.response}</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[#592538]">
            {results.type.charAt(0).toUpperCase() + results.type.slice(1)} Assessment Results
          </h2>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg mb-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="mr-4">
                {getSkillIcon(results.type)}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-800">
                  {language?.name || 'English'} - {level?.name || 'A1 - Beginner'}
                </h3>
                <p className="text-gray-600">
                  {results.type.charAt(0).toUpperCase() + results.type.slice(1)} Assessment
                </p>
              </div>
            </div>
            
            <div className="text-center">
              {renderScoreRing(results.score)}
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">CEFR Level Results</h3>
          
          <div className="flex flex-wrap gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Target Level</p>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getLevelColor(level?.id || 'a1')}`}>
                {level?.id?.toUpperCase() || 'A1'}
              </span>
            </div>
            
            <div>
              <p className="text-sm text-gray-500 mb-1">Achieved Level</p>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getLevelColor(results.cefr?.achieved || 'a1')}`}>
                {results.cefr?.achieved?.toUpperCase() || 'A1'}
              </span>
            </div>
            
            <div>
              <p className="text-sm text-gray-500 mb-1">Recommended Level</p>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getLevelColor(results.cefr?.recommendation || 'a1')}`}>
                {results.cefr?.recommendation?.toUpperCase() || 'A1'}
              </span>
            </div>
          </div>
          
          <div className="mt-4">
            <h4 className="font-medium text-gray-700 mb-2">Feedback</h4>
            <p className="text-gray-600 bg-gray-50 p-3 rounded">{results.feedback}</p>
          </div>
          
          {/* Always show recommendations section */}
          <div className="mt-4 border-t pt-4">
            <h4 className="font-medium text-gray-700 mb-2">Recommendations for Improvement</h4>
            <div className="bg-gray-50 p-3 rounded">
              {hasAiEvaluation && results.tasks[0]?.aiEvaluation?.recommendations?.length > 0 ? (
                <>
                  {results.tasks[0]?.aiEvaluation?.isAiGenerated && (
                    <div className="mb-2 text-xs text-blue-600 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      AI-Generated Recommendations
                    </div>
                  )}
                  <ul className="list-disc pl-5 space-y-2">
                    {results.tasks[0].aiEvaluation.recommendations.map((rec, idx) => (
                      <li key={idx} className="text-gray-600">{rec}</li>
                    ))}
                  </ul>
                </>
              ) : (
                <>
                  <div className="mb-2 text-xs text-gray-500 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Standard Recommendations
                  </div>
                  <ul className="list-disc pl-5 space-y-1">
                    <li className="text-sm text-gray-600">Focus on basic sentence structure and grammar rules.</li>
                    <li className="text-sm text-gray-600">Practice writing short paragraphs that directly address the prompt.</li>
                    <li className="text-sm text-gray-600">Build vocabulary related to common topics in this level.</li>
                  </ul>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Assessment Details</h3>
          
          {results.type === 'reading' || results.type === 'listening' ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm text-gray-500">Correct Answers</p>
                <p className="text-lg font-medium">{results.correctAnswers} / {results.totalQuestions}</p>
              </div>
              
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm text-gray-500">Time Spent</p>
                <p className="text-lg font-medium">
                  {Math.floor(results.timeSpent / 60)}m {results.timeSpent % 60}s
                </p>
              </div>
            </div>
          ) : results.type === 'writing' ? (
            <div>
              <p className="text-sm text-gray-500 mb-2">Writing Tasks Completed</p>
              <div className="space-y-6">
                {results.tasks.map((task, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex justify-between mb-3">
                      <h4 className="font-medium text-[#592538]">{task.title}</h4>
                      <p className="text-sm text-gray-500">Word Count: {task.wordCount} / {task.wordLimit}</p>
                    </div>
                    
                    {/* Show standard metrics if no AI evaluation */}
                    {task.metrics && !task.aiEvaluation && (
                      <div className="mt-2 space-y-2">
                        {task.metrics.map((metric, midx) => (
                          <div key={midx} className="flex justify-between text-sm">
                            <span>{metric.name}</span>
                            <span className={metric.score >= 70 ? 'text-green-600' : metric.score >= 50 ? 'text-yellow-600' : 'text-red-600'}>
                              {metric.comment}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Show AI evaluation if available */}
                    {task.aiEvaluation && renderAIWritingAssessment(task, index)}
                  </div>
                ))}
              </div>
              
              {/* If we have AI evaluations, show a detailed breakdown */}
              {hasAiEvaluation && (
                <div className="mt-6 bg-white p-4 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-700 mb-3">Academic Writing Skills Breakdown</h4>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                    {results.tasks[0]?.aiEvaluation?.criteria.map((criterion, idx) => (
                      <div key={idx} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <p className="text-sm text-center font-medium">{criterion.name}</p>
                        <div className="flex justify-center mt-2">
                          <span className={`font-bold text-lg ${getCriteriaScoreColor(criterion.score)}`}>
                            {criterion.score}/10
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {results.tasks[0]?.aiEvaluation?.aiModel && (
                    <div className="mt-4 text-xs text-gray-500 text-right">
                      Powered by: {results.tasks[0].aiEvaluation.aiModel.split('/').pop()}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-500 mb-2">Speaking Tasks Completed</p>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-lg font-medium">{results.completedTasks} / {results.totalTasks}</p>
              </div>
            </div>
          )}
        </div>

        {/* Add transcript section for A1 voicemail assessment */}
        {isA1Voicemail && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Voicemail Transcript</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">{a1VoicemailTranscript}</pre>
            </div>
          </div>
        )}

        {/* Display discussion answer if available */}
        {results.discussionAnswer && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Discussion</h3>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Do you ever make phone calls or leave voicemail messages in English?</h4>
              <p className="text-gray-600 bg-gray-50 p-3 rounded">{results.discussionAnswer}</p>
            </div>
          </div>
        )}

        {/* Only one Back button at the bottom */}
        <div className="flex justify-center mt-8">
          <button
            onClick={onBack}
            className="px-6 py-3 bg-[#592538] text-white rounded-lg hover:bg-[#6d2c44] flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Assessments
          </button>
        </div>
      </div>
    </div>
  );
};

export default LanguageResults; 