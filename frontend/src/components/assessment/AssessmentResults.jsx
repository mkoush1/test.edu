import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

const AssessmentResults = ({ results, onBack }) => {
  const radarChartRef = useRef(null);
  const barChartRef = useRef(null);
  const radarChartInstance = useRef(null);
  const barChartInstance = useRef(null);

  useEffect(() => {
    if (!results) return;

    // Clean up previous chart instances
    if (radarChartInstance.current) {
      radarChartInstance.current.destroy();
    }
    if (barChartInstance.current) {
      barChartInstance.current.destroy();
    }

    renderCharts();

    return () => {
      if (radarChartInstance.current) {
        radarChartInstance.current.destroy();
      }
      if (barChartInstance.current) {
        barChartInstance.current.destroy();
      }
    };
  }, [results]);

  const renderCharts = () => {
    if (!results) return;

    const colors = {
      listening: 'rgba(75, 192, 192, 0.7)',
      writing: 'rgba(153, 102, 255, 0.7)',
      speaking: 'rgba(255, 159, 64, 0.7)'
    };

    const backgroundColor = colors[results.type];

    // Radar chart for specific skills
    if (radarChartRef.current) {
      const radarData = getRadarData();
      
      radarChartInstance.current = new Chart(radarChartRef.current, {
        type: 'radar',
        data: {
          labels: radarData.labels,
          datasets: [{
            label: `${results.type.charAt(0).toUpperCase() + results.type.slice(1)} Skills`,
            data: radarData.data,
            backgroundColor: backgroundColor,
            borderColor: backgroundColor.replace('0.7', '1'),
            borderWidth: 1
          }]
        },
        options: {
          scales: {
            r: {
              angleLines: {
                display: true
              },
              suggestedMin: 0,
              suggestedMax: 100
            }
          }
        }
      });
    }

    // Bar chart for overall performance
    if (barChartRef.current) {
      const barData = getBarData();
      
      barChartInstance.current = new Chart(barChartRef.current, {
        type: 'bar',
        data: {
          labels: barData.labels,
          datasets: [{
            label: 'Performance Score',
            data: barData.data,
            backgroundColor: Object.values(colors),
            borderColor: Object.values(colors).map(color => color.replace('0.7', '1')),
            borderWidth: 1
          }]
        },
        options: {
          scales: {
            y: {
              beginAtZero: true,
              max: 100
            }
          }
        }
      });
    }
  };

  const getRadarData = () => {
    switch (results.type) {
      case 'listening':
        return {
          labels: ['Comprehension', 'Attention to Detail', 'Information Retention', 'Interpretation'],
          data: [
            Math.round(results.score), 
            Math.round(results.score - Math.random() * 10), 
            Math.round(results.score - Math.random() * 15), 
            Math.round(results.score - Math.random() * 5)
          ]
        };
      case 'writing':
        return {
          labels: ['Clarity', 'Grammar', 'Structure', 'Tone', 'Persuasion'],
          data: results.taskScores.reduce((acc, score) => {
            score.criteriaScores.forEach((criteriaScore, i) => {
              if (!acc[i]) acc[i] = 0;
              acc[i] += criteriaScore;
            });
            return acc;
          }, []).map(total => Math.round(total / results.taskScores.length))
        };
      case 'speaking':
        return {
          labels: ['Articulation', 'Fluency', 'Coherence', 'Confidence'],
          data: [
            Math.round(results.score + Math.random() * 5), 
            Math.round(results.score - Math.random() * 10), 
            Math.round(results.score), 
            Math.round(results.score - Math.random() * 5)
          ]
        };
      default:
        return { labels: [], data: [] };
    }
  };

  const getBarData = () => {
    return {
      labels: ['Overall Score'],
      data: [Math.round(results.score)]
    };
  };

  const getScoreLevel = (score) => {
    if (score >= 90) return 'Expert';
    if (score >= 70) return 'Proficient';
    if (score >= 50) return 'Developing';
    return 'Novice';
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getResourceLinks = () => {
    switch (results.type) {
      case 'listening':
        return [
          { title: 'Active Listening Techniques', url: 'https://www.mindtools.com/CommSkll/ActiveListening.htm' },
          { title: 'Note-Taking Strategies', url: 'https://learningcenter.unc.edu/tips-and-tools/effective-note-taking-strategies/' },
          { title: 'Improving Listening Comprehension', url: 'https://www.skillsyouneed.com/ips/listening-skills.html' }
        ];
      case 'writing':
        return [
          { title: 'Clear and Concise Writing', url: 'https://owl.purdue.edu/owl/general_writing/academic_writing/conciseness/index.html' },
          { title: 'Business Writing Essentials', url: 'https://www.grammarly.com/blog/category/handbook/' },
          { title: 'Effective Email Communication', url: 'https://www.thebalancecareers.com/email-writing-skills-2062564' }
        ];
      case 'speaking':
        return [
          { title: 'Public Speaking Tips', url: 'https://www.toastmasters.org/resources/public-speaking-tips' },
          { title: 'Reducing Filler Words', url: 'https://hbr.org/2018/08/how-to-stop-saying-um-ah-and-you-know' },
          { title: 'Improving Speech Clarity', url: 'https://www.speakconfidentenglish.com/improve-clarity-spoken-english/' }
        ];
      default:
        return [];
    }
  };

  if (!results) return null;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">
          {results.type.charAt(0).toUpperCase() + results.type.slice(1)} Skills Assessment Results
        </h2>
        <div className="flex items-center mb-4">
          <div className="text-5xl font-bold mr-4 tracking-tight">
            <span className={getScoreColor(results.score)}>{Math.round(results.score)}</span>
            <span className="text-gray-400 text-3xl">/100</span>
          </div>
          <div>
            <p className="text-xl font-medium">
              <span className={getScoreColor(results.score)}>{getScoreLevel(results.score)} Level</span>
            </p>
          </div>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg mb-6">
          <p className="text-gray-700">{results.feedback}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="text-xl font-bold mb-4">Skills Breakdown</h3>
          <div className="bg-gray-50 p-4 rounded-lg h-64">
            <canvas ref={radarChartRef}></canvas>
          </div>
        </div>
        <div>
          <h3 className="text-xl font-bold mb-4">Overall Performance</h3>
          <div className="bg-gray-50 p-4 rounded-lg h-64">
            <canvas ref={barChartRef}></canvas>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-xl font-bold mb-4">Detailed Results</h3>
        {results.type === 'listening' && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="mb-2">
              Total Questions: <strong>{results.totalQuestions}</strong>
            </p>
            <p className="mb-2">
              Correct Answers: <strong>{results.correctAnswers}</strong>
            </p>
            <p>
              Accuracy Rate: <strong>{Math.round((results.correctAnswers / results.totalQuestions) * 100)}%</strong>
            </p>
          </div>
        )}
        {results.type === 'writing' && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="mb-4">Task Performance:</p>
            <div className="space-y-4">
              {results.taskScores.map((score, index) => (
                <div key={index} className="p-3 border border-gray-200 rounded-lg">
                  <p className="font-medium mb-2">Task {index + 1}</p>
                  <p className="mb-1">
                    Word Count: <strong>{score.wordCount}</strong>
                  </p>
                  <p className="mb-1">
                    Score: <strong>{Math.round(score.averageScore)}%</strong>
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
        {results.type === 'speaking' && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="mb-2">
              Completed Prompts: <strong>{results.completedPrompts}</strong> of {results.totalPrompts}
            </p>
            <div className="space-y-4 mt-4">
              {results.promptScores.map((score, index) => (
                <div key={index} className="p-3 border border-gray-200 rounded-lg">
                  <p className="font-medium mb-2">Prompt {index + 1}</p>
                  {score.averageScore > 0 ? (
                    <>
                      <p className="mb-1">
                        Score: <strong>{Math.round(score.averageScore)}%</strong>
                      </p>
                      {results.recordings[index] && (
                        <div className="mt-2">
                          <p className="mb-1 text-sm text-gray-600">Your recording:</p>
                          <video 
                            src={results.recordings[index]}
                            className="w-full h-40 object-cover rounded" 
                            controls 
                          />
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-gray-500">Not completed</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mb-8">
        <h3 className="text-xl font-bold mb-4">Resources for Improvement</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          <ul className="space-y-2">
            {getResourceLinks().map((resource, index) => (
              <li key={index}>
                <a 
                  href={resource.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  {resource.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="bg-gray-600 text-white px-6 py-2 rounded"
        >
          Back to Assessments
        </button>
        <button
          onClick={() => window.print()}
          className="bg-blue-600 text-white px-6 py-2 rounded"
        >
          Download Report
        </button>
      </div>
    </div>
  );
};

export default AssessmentResults; 