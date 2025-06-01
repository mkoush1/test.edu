import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import communicationService from '../../services/communication.service';

const CommunicationOverview = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assessmentData, setAssessmentData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await communicationService.getAggregatedAssessments();
        if (response && response.success) {
          setAssessmentData(response.data);
        } else {
          // Quiet failure without detailed error message
          setAssessmentData(null);
        }
      } catch (error) {
        // Simplified error handling without excessive logging
        setAssessmentData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleStartAssessment = () => {
    navigate('/communication-assessment');
  };

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#592538]"></div>
        </div>
      </div>
    );
  }

  // If error or no assessment data, show a simplified message
  if (error || !assessmentData) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h3 className="text-xl font-bold text-[#592538] mb-2">Communication Skills Assessment</h3>
          <p className="text-gray-700 mb-4">Unable to load assessment data at this time</p>
          <button
            onClick={handleStartAssessment}
            className="px-4 py-2 bg-[#592538] text-white rounded-lg hover:bg-[#6d2c44] transition-colors"
          >
            Take Assessment
          </button>
        </div>
      </div>
    );
  }

  // Display assessment progress and scores
  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-[#592538]">Communication Skills Assessment</h3>
        <div className="flex items-center">
          <span className="text-lg font-bold mr-2">{assessmentData.overallScore}%</span>
          <span className="text-sm text-gray-600">Overall Score</span>
        </div>
      </div>

      {/* Progress bar showing completion percentage */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Progress</span>
          <span>{Math.round(assessmentData.completionPercentage)}% Complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-[#592538] h-2.5 rounded-full" 
            style={{ width: `${assessmentData.completionPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Skill breakdown grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <SkillCard 
          title="Reading" 
          score={assessmentData.aggregatedScores.reading} 
          completed={assessmentData.completionStatus.reading}
        />
        <SkillCard 
          title="Writing" 
          score={assessmentData.aggregatedScores.writing} 
          completed={assessmentData.completionStatus.writing}
        />
        <SkillCard 
          title="Listening" 
          score={assessmentData.aggregatedScores.listening} 
          completed={assessmentData.completionStatus.listening}
        />
        <SkillCard 
          title="Speaking" 
          score={assessmentData.aggregatedScores.speaking} 
          completed={assessmentData.completionStatus.speaking}
        />
      </div>

      {/* Continue button */}
      <div className="flex justify-center">
        <button
          onClick={handleStartAssessment}
          className="px-6 py-3 bg-[#592538] text-white rounded-lg hover:bg-[#6d2c44] transition-colors"
        >
          {assessmentData.totalCompleted === 0 ? 'Start Assessment' : 'Continue Assessment'}
        </button>
      </div>
    </div>
  );
};

// Helper component for each skill
const SkillCard = ({ title, score, completed }) => {
  const getIcon = (skillType) => {
    switch (skillType.toLowerCase()) {
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
        return null;
    }
  };

  return (
    <div className={`border rounded-lg p-4 ${completed ? 'bg-gray-50' : 'bg-gray-100 opacity-70'}`}>
      <div className="flex items-center mb-2">
        <div className="mr-3 text-[#592538]">
          {getIcon(title)}
        </div>
        <h4 className="font-medium">{title}</h4>
      </div>
      <div className="flex justify-between items-center">
        <div>
          {completed ? (
            <span className="text-xl font-bold">{score}%</span>
          ) : (
            <span className="text-sm text-gray-500">Not completed</span>
          )}
        </div>
        {completed && (
          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
            Completed
          </span>
        )}
      </div>
    </div>
  );
};

export default CommunicationOverview; 