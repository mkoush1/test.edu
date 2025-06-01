import React, { useState, useEffect } from 'react';

const ListeningAssessment = ({ onComplete }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);

  const questions = [
    {
      id: 1,
      audioUrl: '/audio/customer-complaint.mp3',
      question: 'What is the main issue the customer is experiencing?',
      options: [
        'Product delivery delay',
        'Product quality issue',
        'Customer service problem',
        'Billing discrepancy'
      ],
      correctAnswer: 0
    },
    {
      id: 2,
      audioUrl: '/audio/team-meeting.mp3',
      question: 'What was the key decision made during the team meeting?',
      options: [
        'To extend the project deadline',
        'To hire additional team members',
        'To change the project scope',
        'To implement a new technology'
      ],
      correctAnswer: 2
    },
    {
      id: 3,
      audioUrl: '/audio/technical-instructions.mp3',
      question: 'What is the first step in the technical process?',
      options: [
        'Initialize the system',
        'Check the configuration',
        'Run diagnostics',
        'Update software'
      ],
      correctAnswer: 1
    }
  ];

  useEffect(() => {
    if (timeLeft === 0) {
      handleNextQuestion();
    }
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const handleAnswer = (answerIndex) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answerIndex;
    setAnswers(newAnswers);
  };

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setIsPlaying(false);
      setTimeLeft(null);
    } else {
      calculateResults();
    }
  };

  const calculateResults = () => {
    const score = answers.reduce((total, answer, index) => {
      return total + (answer === questions[index].correctAnswer ? 1 : 0);
    }, 0);

    const results = {
      type: 'listening',
      score: (score / questions.length) * 100,
      totalQuestions: questions.length,
      correctAnswers: score,
      feedback: generateFeedback(score)
    };

    onComplete(results);
  };

  const generateFeedback = (score) => {
    const percentage = (score / questions.length) * 100;
    if (percentage >= 90) {
      return 'Excellent listening skills! You demonstrate strong comprehension and attention to detail.';
    } else if (percentage >= 70) {
      return 'Good listening skills. You show solid comprehension but could improve in some areas.';
    } else if (percentage >= 50) {
      return 'Developing listening skills. Focus on active listening and note-taking techniques.';
    } else {
      return 'Basic listening skills. Consider practicing with audio materials and focusing on key information.';
    }
  };

  const playAudio = () => {
    setIsPlaying(true);
    setTimeLeft(30); // 30 seconds to listen and answer
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">
          Question {currentQuestion + 1} of {questions.length}
        </h2>
        <div className="mb-4">
          <button
            onClick={playAudio}
            disabled={isPlaying}
            className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-300"
          >
            {isPlaying ? 'Playing...' : 'Play Audio'}
          </button>
          {timeLeft && (
            <span className="ml-4 text-gray-600">
              Time remaining: {timeLeft} seconds
            </span>
          )}
        </div>
        <p className="text-lg mb-4">{questions[currentQuestion].question}</p>
        <div className="space-y-3">
          {questions[currentQuestion].options.map((option, index) => (
            <div
              key={index}
              className={`p-3 border rounded cursor-pointer ${
                answers[currentQuestion] === index
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300'
              }`}
              onClick={() => handleAnswer(index)}
            >
              {option}
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-between">
        <button
          onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
          disabled={currentQuestion === 0}
          className="bg-gray-500 text-white px-4 py-2 rounded disabled:bg-gray-300"
        >
          Previous
        </button>
        <button
          onClick={handleNextQuestion}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          {currentQuestion === questions.length - 1 ? 'Finish' : 'Next'}
        </button>
      </div>
    </div>
  );
};

export default ListeningAssessment; 