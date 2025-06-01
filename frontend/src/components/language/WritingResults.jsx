import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Component for displaying writing assessment results
 */
const WritingResults = ({ results, onBack }) => {
  // Format date
  const formattedDate = new Date().toLocaleDateString();
  
  // Calculate percentage score directly from criteria scores to ensure accuracy
  let scorePercentage = 0;
  
  // If we have criteria scores, sum them up
  if (results?.tasks && results.tasks.length > 0 && results.tasks[0]?.aiEvaluation?.criteria) {
    const criteria = results.tasks[0].aiEvaluation.criteria;
    // Use the actual score without multiplying
    scorePercentage = criteria.reduce((sum, criterion) => sum + criterion.score, 0);
  } else {
    // Fallback to the provided score if criteria not available
    scorePercentage = Math.round(results?.score || 0);
  }
  
  // Get the task data (we now only have one task)
  const task = results?.tasks?.[0] || {};
  
  return (
    <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="p-4 flex justify-between items-center">
        <h2 className="text-lg font-medium text-[#592538]">Writing Assessment Results</h2>
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
          <div className="font-medium text-gray-800">
            {results?.language === 'french' ? 'French' : 'English'} - {results?.level?.toUpperCase() || 'B1'} - 
            {results?.level === 'a1' ? ' Beginner' : 
             results?.level === 'a2' ? ' Elementary' : 
             results?.level === 'b1' ? ' Intermediate' : 
             results?.level === 'b2' ? ' Upper Intermediate' : 
             results?.level === 'c1' ? ' Advanced' : ' Proficient'}
          </div>
          <div className="text-sm text-gray-600">Writing Assessment</div>
        </div>
        
        <div className="text-2xl font-bold text-[#592538]">
          {scorePercentage}%
        </div>
      </div>

      {/* Results Content */}
      <div className="p-4">
        <h3 className="text-base font-medium mb-4">Assessment Results</h3>
        
        {/* AI Evaluation */}
        <div className="mb-6 border border-blue-200 rounded-lg bg-blue-50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-medium text-blue-800">Writing Evaluation</span>
          </div>
          
          <div className="flex items-start mb-4">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mr-4 border border-blue-100 shadow-sm">
              <div className="text-lg font-bold text-[#592538]">{scorePercentage}%</div>
            </div>
            
            <div>
              <div className="text-sm text-gray-700 font-medium">Assessment Score</div>
              <div className="text-xs text-gray-500">Evaluated on {formattedDate}</div>
            </div>
          </div>
          
          <div className="border-t border-blue-100 pt-3">
            <p className="text-gray-700 mb-4">{results?.feedback || "Your writing shows good progress."}</p>
            
            {/* Criteria Scores */}
            {task?.aiEvaluation?.criteria && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Writing Criteria</h4>
                <div className="space-y-3">
                  {task.aiEvaluation.criteria.map((criterion, index) => (
                    <div key={index} className="bg-white p-3 rounded border border-blue-100">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{criterion.name}</span>
                        <span className="text-sm font-medium text-[#592538]">{criterion.score}/20</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{criterion.feedback}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Writing Task */}
        {task && (
          <div className="mb-6 border border-gray-200 rounded-lg">
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <h4 className="text-sm font-medium text-gray-700">{task.title}</h4>
              <div className="text-xs text-gray-500 mt-1">
                Word count: {task.wordCount || 0} words (Target: ~{task.wordLimit} words)
              </div>
            </div>
            
            <div className="p-4">
              <div className="mb-4">
                <p className="text-xs text-gray-600 mb-1">Prompt:</p>
                <p className="text-sm text-gray-800 bg-gray-50 p-2 rounded">{task.prompt}</p>
              </div>
              
              <div>
                <p className="text-xs text-gray-600 mb-1">Your response:</p>
                <div className="bg-gray-50 p-3 rounded text-sm">
                  <p className="text-gray-800 whitespace-pre-line">{task.response}</p>
                </div>
              </div>
            </div>
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

export default WritingResults; 