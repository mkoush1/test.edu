import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReadingAssessment from '../components/language/ReadingAssessment';
import WritingAssessment from '../components/language/WritingAssessment';
import ListeningAssessment from '../components/language/ListeningAssessment';
import SpeakingAssessment from '../components/language/SpeakingAssessment';
import LanguageResults from '../components/language/LanguageResults';
import SpeakingAssessmentResults from '../components/language/SpeakingAssessmentResults';
import SimpleSpeakingResults from '../components/language/SimpleSpeakingResults';

const LanguageAssessment = () => {
  const [currentModule, setCurrentModule] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [results, setResults] = useState(null);
  const navigate = useNavigate();

  const languages = [
    { id: 'english', name: 'English' },
    { id: 'french', name: 'French' },
    { id: 'german', name: 'German' },
    { id: 'spanish', name: 'Spanish' }
  ];

  const levels = [
    { id: 'a1', name: 'A1 - Beginner', description: 'Can understand and use familiar everyday expressions and very basic phrases' },
    { id: 'a2', name: 'A2 - Elementary', description: 'Can communicate in simple and routine tasks on familiar topics' },
    { id: 'b1', name: 'B1 - Intermediate', description: 'Can deal with most situations likely to arise while traveling' },
    { id: 'b2', name: 'B2 - Upper Intermediate', description: 'Can interact with a degree of fluency and spontaneity with native speakers' },
    { id: 'c1', name: 'C1 - Advanced', description: 'Can express ideas fluently and spontaneously without much obvious searching for expressions' },
    { id: 'c2', name: 'C2 - Proficiency', description: 'Can understand with ease virtually everything heard or read' }
  ];

  const modules = [
    {
      id: 'reading',
      title: 'Reading Comprehension',
      description: 'Assess your ability to understand written text',
      component: ReadingAssessment
    },
    {
      id: 'writing',
      title: 'Writing Skills',
      description: 'Evaluate your written expression abilities',
      component: WritingAssessment
    },
    {
      id: 'listening',
      title: 'Listening Comprehension',
      description: 'Test your ability to understand spoken language',
      component: ListeningAssessment
    },
    {
      id: 'speaking',
      title: 'Speaking Skills',
      description: 'Assess your oral expression and interaction abilities',
      component: SpeakingAssessment
    }
  ];

  const handleLanguageSelect = (languageId) => {
    setSelectedLanguage(languageId);
  };

  const handleLevelSelect = (levelId) => {
    setSelectedLevel(levelId);
  };

  const handleModuleSelect = (moduleId) => {
    setCurrentModule(moduleId);
  };

  const handleAssessmentComplete = (assessmentResults) => {
    setResults(assessmentResults);
  };

  const handleBack = () => {
    if (results) {
      setResults(null);
    } else if (currentModule) {
      setCurrentModule(null);
    } else if (selectedLevel) {
      setSelectedLevel(null);
    } else if (selectedLanguage) {
      setSelectedLanguage(null);
    } else {
      navigate('/assessments');
    }
  };

  const renderContent = () => {
    if (results) {
      if (results.type === 'speaking') {
        const useSimpleUI = true;
        
        return useSimpleUI ? (
          <SimpleSpeakingResults 
            results={results} 
            onBack={handleBack} 
          />
        ) : (
          <SpeakingAssessmentResults 
            results={results} 
            onBack={handleBack} 
          />
        );
      }
      
      return <LanguageResults 
        results={results} 
        language={languages.find(l => l.id === selectedLanguage)} 
        level={levels.find(l => l.id === selectedLevel)}
        onBack={handleBack} 
      />;
    }

    if (currentModule && selectedLevel && selectedLanguage) {
      const ModuleComponent = modules.find(m => m.id === currentModule).component;
      return <ModuleComponent 
        onComplete={handleAssessmentComplete} 
        level={selectedLevel} 
        language={selectedLanguage} 
        onBack={handleBack}
      />;
    }

    if (selectedLevel && selectedLanguage) {
      return (
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-[#592538]">
              Choose Assessment Module
            </h2>
            <button 
              onClick={handleBack}
              className="px-4 py-2 text-sm font-medium text-[#592538] rounded-lg border border-[#592538] hover:bg-[#592538] hover:text-white transition-colors"
            >
              Back
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {modules.map((module) => (
              <div
                key={module.id}
                className="bg-white rounded-lg shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow"
                onClick={() => handleModuleSelect(module.id)}
              >
                <h3 className="text-xl font-bold mb-2 text-[#592538]">{module.title}</h3>
                <p className="text-gray-600">{module.description}</p>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (selectedLanguage) {
      return (
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-[#592538]">
              Select Your Proficiency Level
            </h2>
            <button 
              onClick={handleBack}
              className="px-4 py-2 text-sm font-medium text-[#592538] rounded-lg border border-[#592538] hover:bg-[#592538] hover:text-white transition-colors"
            >
              Back
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {levels.map((level) => (
              <div
                key={level.id}
                className="bg-white rounded-lg shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow"
                onClick={() => handleLevelSelect(level.id)}
              >
                <h3 className="text-xl font-bold mb-2 text-[#592538]">{level.name}</h3>
                <p className="text-gray-600">{level.description}</p>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-[#592538]">
            Select Language
          </h2>
          <button 
            onClick={handleBack}
            className="px-4 py-2 text-sm font-medium text-[#592538] rounded-lg border border-[#592538] hover:bg-[#592538] hover:text-white transition-colors"
          >
            Back to Assessments
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {languages.map((language) => (
            <div
              key={language.id}
              className="bg-white rounded-lg shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow flex flex-col items-center justify-center"
              onClick={() => handleLanguageSelect(language.id)}
            >
              <div className="text-4xl mb-4">
                {language.id === 'english' && '🇬🇧'}
                {language.id === 'french' && '🇫🇷'}
                {language.id === 'german' && '🇩🇪'}
                {language.id === 'spanish' && '🇪🇸'}
              </div>
              <h3 className="text-xl font-bold text-[#592538]">{language.name}</h3>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-[#592538] mb-4">
            CEFR Language Assessment
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Assess your language skills based on the Common European Framework of Reference for Languages (CEFR),
            the international standard for describing language ability.
          </p>
        </div>
        {renderContent()}
      </div>
    </div>
  );
};

export default LanguageAssessment; 