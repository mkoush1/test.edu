import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import listeningAssessmentService from '../../services/listeningAssessment.service';
import { format } from 'date-fns';

const ListeningAssessmentHistory = ({ userId }) => {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch assessments
        const assessmentsResponse = await listeningAssessmentService.getUserAssessments(userId);
        
        if (assessmentsResponse.success) {
          setAssessments(assessmentsResponse.assessments || []);
        } else {
          setError('Failed to fetch assessment history');
        }
        
        // Fetch statistics
        const statsResponse = await listeningAssessmentService.getUserStatistics(userId);
        
        if (statsResponse.success) {
          setStatistics(statsResponse.statistics);
        }
      } catch (err) {
        console.error('Error fetching listening assessment data:', err);
        setError('An error occurred while fetching assessment history');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'PPP');
    } catch (e) {
      return 'Invalid date';
    }
  };

  const getLevelLabel = (level) => {
    return level.toUpperCase();
  };

  const getLanguageLabel = (language) => {
    return language.charAt(0).toUpperCase() + language.slice(1);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const viewAssessmentDetails = (assessmentId) => {
    navigate(`/listening-assessment/${assessmentId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <strong>Error:</strong> {error}
      </div>
    );
  }

  if (assessments.length === 0) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold mb-2">No Listening Assessments</h2>
        <p className="text-gray-600">You haven't completed any listening assessments yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-6">Listening Assessment History</h2>
      
      {/* Statistics Summary */}
      {statistics && (
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="text-lg font-semibold mb-3">Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-3 rounded shadow">
              <div className="text-gray-600">Total Assessments</div>
              <div className="text-2xl font-bold">{statistics.totalAssessments}</div>
            </div>
            <div className="bg-white p-3 rounded shadow">
              <div className="text-gray-600">Average Score</div>
              <div className="text-2xl font-bold">{statistics.averageScore.toFixed(1)}%</div>
            </div>
            <div className="bg-white p-3 rounded shadow">
              <div className="text-gray-600">Highest Score</div>
              <div className="text-2xl font-bold">{statistics.highestScore.toFixed(1)}%</div>
            </div>
          </div>
          
          {/* Level Breakdown */}
          {Object.keys(statistics.levelBreakdown).length > 0 && (
            <div className="mt-4">
              <h4 className="text-md font-semibold mb-2">Level Breakdown</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                {Object.entries(statistics.levelBreakdown).map(([level, data]) => (
                  <div key={level} className="bg-white p-2 rounded shadow text-center">
                    <div className="font-bold">{level.toUpperCase()}</div>
                    <div className="text-sm">{data.count} assessments</div>
                    <div className="text-sm">Avg: {data.averageScore.toFixed(1)}%</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Assessment History Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Level
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Language
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Score
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Questions
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {assessments.map((assessment) => (
              <tr key={assessment._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(assessment.completedAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {getLevelLabel(assessment.level)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {getLanguageLabel(assessment.language)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`text-sm font-semibold ${getScoreColor(assessment.score)}`}>
                    {assessment.score.toFixed(1)}%
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {assessment.correctAnswers} / {assessment.totalQuestions}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <button
                    onClick={() => viewAssessmentDetails(assessment._id)}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Next Available Date */}
      {assessments.length > 0 && assessments[0].nextAvailableDate && new Date(assessments[0].nextAvailableDate) > new Date() && (
        <div className="mt-6 bg-blue-50 p-4 rounded-lg text-blue-800">
          <p className="font-medium">
            Your next listening assessment will be available on {formatDate(assessments[0].nextAvailableDate)}.
          </p>
        </div>
      )}
    </div>
  );
};

export default ListeningAssessmentHistory; 