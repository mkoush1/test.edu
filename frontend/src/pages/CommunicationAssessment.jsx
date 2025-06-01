import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ListeningAssessment from '../components/language/ListeningAssessment';
import WritingAssessment from '../components/language/WritingAssessment';
import SpeakingAssessment from '../components/language/SpeakingAssessment';
import ReadingAssessment from '../components/language/ReadingAssessment';
import LanguageResults from '../components/language/LanguageResults';
import SimpleSpeakingResults from '../components/language/SimpleSpeakingResults';
import WritingResults from '../components/language/WritingResults';

const CommunicationAssessment = () => {
  const [currentModule, setCurrentModule] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState('b1'); // Default to intermediate
  const [selectedLanguage, setSelectedLanguage] = useState('english'); // Only English
  const [results, setResults] = useState(null);
  const navigate = useNavigate();
  
  // Check if we're viewing a previously saved assessment
  useEffect(() => {
    const savedAssessment = sessionStorage.getItem('viewingAssessment');
    if (savedAssessment) {
      try {
        const parsedAssessment = JSON.parse(savedAssessment);
        console.log('Loaded saved assessment:', parsedAssessment);
        
        // Set the selected level from the assessment
        if (parsedAssessment.level) {
          setSelectedLevel(parsedAssessment.level);
        }
        
        // Set the selected language from the assessment
        if (parsedAssessment.language) {
          setSelectedLanguage(parsedAssessment.language);
        }
        
        // Set the current module
        setCurrentModule('speaking'); // Since we only support speaking assessments currently
        
        // Load the full assessment details using the assessment ID
        if (parsedAssessment.id) {
          import('../services/assessment.service').then(module => {
            const AssessmentService = module.default;
            AssessmentService.getSpeakingAssessment(parsedAssessment.id)
              .then(response => {
                if (response.success && response.assessment) {
                  // Prepare the assessment data for display
                  const assessmentData = {
                    ...response.assessment,
                    type: 'speaking', // Always set type to 'speaking' for previously saved assessments
                    feedback: response.assessment.feedback || parsedAssessment.feedback || '',
                    score: response.assessment.score || parsedAssessment.score || 0,
                    status: response.assessment.status || parsedAssessment.status || 'pending',
                    supervisorFeedback: response.assessment.supervisorFeedback || parsedAssessment.supervisorFeedback,
                    supervisorScore: response.assessment.supervisorScore || parsedAssessment.supervisorScore,
                    assessmentId: parsedAssessment.id
                  };
                  
                  // Set the results to display the assessment
                  setResults(assessmentData);
                  
                  // Clear the saved assessment to prevent loading it again
                  sessionStorage.removeItem('viewingAssessment');
                }
              })
              .catch(error => {
                console.error('Error loading assessment details:', error);
              });
          });
        }
      } catch (error) {
        console.error('Error parsing saved assessment:', error);
        sessionStorage.removeItem('viewingAssessment');
      }
    }
  }, []);

  const modules = [
    {
      id: 'listening',
      title: 'Listening Skills',
      description: 'Evaluate your ability to comprehend and interpret spoken information',
      component: ListeningAssessment,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
      )
    },
    {
      id: 'reading',
      title: 'Reading Skills',
      description: 'Assess your ability to understand written text',
      component: ReadingAssessment,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    },
    {
      id: 'writing',
      title: 'Writing Skills',
      description: 'Assess your written communication effectiveness',
      component: WritingAssessment,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      )
    },
    {
      id: 'speaking',
      title: 'Speaking Skills',
      description: 'Test your verbal communication and presentation skills',
      component: SpeakingAssessment,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      )
    }
  ];

  const levels = [
    { 
      id: 'a1', 
      name: 'A1 - Beginner', 
      description: 'Can understand and use familiar everyday expressions and very basic phrases',
      color: 'from-green-50 to-green-100 border-green-200 hover:border-green-300'
    },
    { 
      id: 'a2', 
      name: 'A2 - Elementary', 
      description: 'Can communicate in simple and routine tasks on familiar topics',
      color: 'from-green-100 to-green-200 border-green-300 hover:border-green-400'
    },
    { 
      id: 'b1', 
      name: 'B1 - Intermediate', 
      description: 'Can deal with most situations likely to arise while traveling',
      color: 'from-blue-50 to-blue-100 border-blue-200 hover:border-blue-300'
    },
    { 
      id: 'b2', 
      name: 'B2 - Upper Intermediate', 
      description: 'Can interact with a degree of fluency and spontaneity with native speakers',
      color: 'from-blue-100 to-blue-200 border-blue-300 hover:border-blue-400'
    },
    { 
      id: 'c1', 
      name: 'C1 - Advanced', 
      description: 'Can express ideas fluently and spontaneously without much obvious searching for expressions',
      color: 'from-purple-50 to-purple-100 border-purple-200 hover:border-purple-300'
    }
  ];

  const handleModuleSelect = (moduleId) => {
    setCurrentModule(moduleId);
  };

  const handleLevelSelect = (levelId) => {
    setSelectedLevel(levelId);
  };

  const handleAssessmentComplete = (assessmentResults) => {
    // Ensure we have the type property set for proper display
    if (assessmentResults && !assessmentResults.type && currentModule) {
      assessmentResults.type = currentModule;
    }
    
    // For speaking assessments, make sure we properly handle pending status
    if (assessmentResults && assessmentResults.type === 'speaking') {
      // If the status is 'pending' or pendingReview is true, ensure they're consistently set
      if (assessmentResults.status === 'pending' || assessmentResults.pendingReview) {
        assessmentResults.status = 'pending';
        assessmentResults.pendingReview = true;
      }
      
      // For evaluated assessments, ensure supervisor score is available
      if (assessmentResults.status === 'evaluated' && !assessmentResults.supervisorScore) {
        console.log('Adding default supervisor score for evaluated speaking assessment');
        assessmentResults.supervisorScore = 7; // Default if not provided
      }
    }
    
    // Log the results to help with debugging
    console.log('Assessment completed with results:', {
      hasType: !!assessmentResults?.type,
      type: assessmentResults?.type,
      currentModule,
      assessmentId: assessmentResults?.assessmentId,
      status: assessmentResults?.status,
      pendingReview: assessmentResults?.pendingReview,
      supervisorScore: assessmentResults?.supervisorScore
    });
    
    setResults(assessmentResults);
  };

  const handleBack = () => {
    if (results) {
      setResults(null);
      setCurrentModule(null);
    } else if (currentModule) {
      setCurrentModule(null);
    } else {
      navigate('/assessments');
    }
  };

  const renderContent = () => {
    if (results) {
      // For speaking assessments, use the SimpleSpeakingResults component
      if (results.type === 'speaking') {
        return (
          <div className="max-w-3xl mx-auto">
            <SimpleSpeakingResults 
              results={results}
              onBack={handleBack}
            />
          </div>
        );
      }
      
      // For writing assessments, use the WritingResults component
      if (results.type === 'writing') {
        return (
          <div className="max-w-3xl mx-auto">
            <WritingResults 
              results={results}
              onBack={handleBack}
            />
          </div>
        );
      }
      
      // For other types of assessments, show the standard results view without duplicate header
      return (
        <div className="max-w-3xl mx-auto">
          <LanguageResults 
            results={results}
            level={selectedLevel}
            language={selectedLanguage}
            onBack={handleBack}
          />
        </div>
      );
    }

    if (currentModule) {
      const ModuleComponent = modules.find(m => m.id === currentModule).component;
      // Make sure level and language are defined
      const safeLevel = selectedLevel || 'b1';
      const safeLanguage = selectedLanguage || 'english';
      
      return (
        <div className="max-w-5xl mx-auto">
          <ModuleComponent 
            onComplete={handleAssessmentComplete} 
            level={safeLevel}
            language={safeLanguage}
            onBack={handleBack}
          />
        </div>
      );
    }

    return (
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <button 
            onClick={handleBack}
            className="px-4 py-2 text-sm font-medium text-[#592538] rounded-lg border border-[#592538] hover:bg-[#592538] hover:text-white transition-colors"
          >
            Back
          </button>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-[#592538] to-[#7b3049] p-8 text-white">
            <h2 className="text-3xl font-bold mb-4">
              Communication Skills Assessment
            </h2>
            <p className="text-white/90 max-w-3xl">
              Assess your language communication skills with these modules. Each module focuses on a different aspect of language proficiency.
            </p>
          </div>
          
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {modules.map((module) => (
                <div 
                  key={module.id}
                  onClick={() => handleModuleSelect(module.id)}
                  className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all hover:border-[#592538]/30 cursor-pointer"
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0 bg-[#592538]/10 p-3 rounded-lg mr-4">
                      {module.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-[#592538] mb-2">
                        {module.title}
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {module.description}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">
                          Selected level: <span className="font-medium">{levels.find(l => l.id === selectedLevel)?.name || 'B1 - Intermediate'}</span>
                        </span>
                        <button className="px-4 py-2 bg-[#592538] text-white rounded-lg hover:bg-[#6d2c44] transition-colors text-sm font-medium flex items-center">
                          Start Assessment
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-12">
              <div className="flex items-center mb-6">
                <div className="w-10 h-1 bg-[#592538] rounded-full mr-3"></div>
                <h3 className="text-xl font-bold text-gray-800">CEFR Levels</h3>
                <p className="ml-4 text-sm text-gray-600">Select your proficiency level:</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {levels.map((level) => (
                  <div 
                    key={level.id} 
                    onClick={() => handleLevelSelect(level.id)}
                    className={`border rounded-lg p-4 bg-gradient-to-br ${level.color} hover:shadow-md transition-shadow cursor-pointer ${selectedLevel === level.id ? 'ring-2 ring-[#592538] ring-offset-2' : ''}`}
                  >
                    <div className="flex justify-between items-center">
                      <h4 className="font-semibold text-gray-800">{level.name}</h4>
                      {selectedLevel === level.id && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#592538]" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{level.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-8 mt-8">
          <div className="text-center mb-6">
            <div className="inline-block p-1.5 rounded-lg bg-[#592538] mb-4">
              <span className="text-white font-medium px-3 py-1">CEFR Standards</span>
            </div>
            <h2 className="text-2xl font-bold text-[#592538] mb-4">
              International Language Standards
            </h2>
            <p className="text-gray-600 max-w-3xl mx-auto">
              Assess your English language skills based on the Common European Framework of Reference for Languages (CEFR).
              This standardized framework is recognized worldwide for measuring language proficiency.
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {renderContent()}
      </div>
    </div>
  );
};

export default CommunicationAssessment; 