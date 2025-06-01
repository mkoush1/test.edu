import React, { useState } from 'react';

const WritingAssessment = ({ onComplete }) => {
  const [currentTask, setCurrentTask] = useState(0);
  const [responses, setResponses] = useState([]);
  const [timeLeft, setTimeLeft] = useState(null);

  const tasks = [
    {
      id: 1,
      title: 'Professional Email',
      prompt: 'Draft an email to a client, Mr. John Doe, who has expressed dissatisfaction with a recent project delay. Apologize for the delay, explain the reason briefly (e.g., unexpected technical issues), provide a revised timeline, and reassure him of your commitment to completing the project to a high standard.',
      timeLimit: 600, // 10 minutes
      wordLimit: 200,
      criteria: ['Clarity', 'Professionalism', 'Completeness', 'Grammar']
    },
    {
      id: 2,
      title: 'Persuasive Memo',
      prompt: 'Write a short memo to your department head proposing a new initiative (e.g., a four-day work week trial). Outline at least two key benefits and address one potential concern.',
      timeLimit: 480, // 8 minutes
      wordLimit: 150,
      criteria: ['Persuasion', 'Structure', 'Audience Awareness', 'Tone']
    },
    {
      id: 3,
      title: 'Technical Summary',
      prompt: 'You are given a 500-word technical report detailing the findings of a recent user experience study. Write a 150-word executive summary highlighting the key findings and main recommendations for a non-technical audience.',
      timeLimit: 480, // 8 minutes
      wordLimit: 150,
      criteria: ['Clarity', 'Conciseness', 'Technical Translation', 'Structure']
    }
  ];

  const handleResponseChange = (value) => {
    const newResponses = [...responses];
    newResponses[currentTask] = value;
    setResponses(newResponses);
  };

  const handleNextTask = () => {
    if (currentTask < tasks.length - 1) {
      setCurrentTask(currentTask + 1);
      setTimeLeft(tasks[currentTask + 1].timeLimit);
    } else {
      calculateResults();
    }
  };

  const calculateResults = () => {
    // In a real implementation, this would use AI or human evaluation
    // For now, we'll simulate a basic scoring system
    const scores = responses.map((response, index) => {
      const task = tasks[index];
      const wordCount = response.split(/\s+/).length;
      const wordScore = Math.min(100, (wordCount / task.wordLimit) * 100);
      
      // Simulate criteria scores (in reality, these would come from AI/human evaluation)
      const criteriaScores = task.criteria.map(() => Math.floor(Math.random() * 40) + 60);
      
      return {
        taskId: task.id,
        wordCount,
        wordScore,
        criteriaScores,
        averageScore: (wordScore + criteriaScores.reduce((a, b) => a + b, 0) / criteriaScores.length) / 2
      };
    });

    const overallScore = scores.reduce((total, score) => total + score.averageScore, 0) / scores.length;

    const results = {
      type: 'writing',
      score: overallScore,
      totalTasks: tasks.length,
      taskScores: scores,
      feedback: generateFeedback(overallScore)
    };

    onComplete(results);
  };

  const generateFeedback = (score) => {
    if (score >= 90) {
      return 'Excellent writing skills! Your responses demonstrate strong clarity, structure, and audience awareness.';
    } else if (score >= 70) {
      return 'Good writing skills. Your responses are clear and well-structured, with room for improvement in some areas.';
    } else if (score >= 50) {
      return 'Developing writing skills. Focus on clarity, structure, and meeting word count requirements.';
    } else {
      return 'Basic writing skills. Consider practicing with writing prompts and focusing on fundamental writing principles.';
    }
  };

  const startTimer = () => {
    if (!timeLeft) {
      setTimeLeft(tasks[currentTask].timeLimit);
    }
  };

  React.useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">
          Task {currentTask + 1} of {tasks.length}: {tasks[currentTask].title}
        </h2>
        <div className="mb-4">
          <p className="text-lg mb-4">{tasks[currentTask].prompt}</p>
          <div className="flex justify-between text-sm text-gray-600 mb-4">
            <span>Word limit: {tasks[currentTask].wordLimit} words</span>
            <span>Time limit: {formatTime(tasks[currentTask].timeLimit)}</span>
          </div>
          {timeLeft && (
            <div className="text-right text-gray-600 mb-4">
              Time remaining: {formatTime(timeLeft)}
            </div>
          )}
        </div>
        <textarea
          className="w-full h-64 p-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Type your response here..."
          value={responses[currentTask] || ''}
          onChange={(e) => handleResponseChange(e.target.value)}
          onFocus={startTimer}
        />
        <div className="mt-2 text-sm text-gray-600">
          Word count: {responses[currentTask]?.split(/\s+/).length || 0}
        </div>
      </div>
      <div className="flex justify-between">
        <button
          onClick={() => setCurrentTask(Math.max(0, currentTask - 1))}
          disabled={currentTask === 0}
          className="bg-gray-500 text-white px-4 py-2 rounded disabled:bg-gray-300"
        >
          Previous
        </button>
        <button
          onClick={handleNextTask}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          {currentTask === tasks.length - 1 ? 'Finish' : 'Next'}
        </button>
      </div>
    </div>
  );
};

export default WritingAssessment; 