import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import CommunicationOverview from "../components/assessment/CommunicationOverview";
import api from "../services/api";
import { decodeJWT } from "../utils/jwt";

const CompletedAssessmentCard = ({ assessment, onViewResults }) => {
  const canRetake = () => {
    if (!assessment.completedAt) return true;
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return new Date(assessment.completedAt) < oneWeekAgo;
  };

  const getRetakeMessage = () => {
    if (canRetake()) {
      return "Available for Retake";
    }
    const nextRetake = new Date(assessment.completedAt);
    nextRetake.setDate(nextRetake.getDate() + 7);
    const daysLeft = Math.ceil((nextRetake - new Date()) / (1000 * 60 * 60 * 24));
    return `Can retake in ${daysLeft} days`;
  };

  const getScore = () => {
    if (typeof assessment.score === 'number') {
      return Math.round(assessment.score);
    }
    return 0;
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-[#592538]">
            {assessment.assessmentType?.charAt(0).toUpperCase() + assessment.assessmentType?.slice(1) || 'Assessment'}
          </h3>
          <span className={`text-sm px-3 py-1 rounded-full ${
            canRetake() ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
          }`}>
            {getRetakeMessage()}
          </span>
        </div>

        <div className="space-y-4">
          {typeof assessment.score === 'number' && (
            <div className="flex items-center justify-between text-gray-600">
              <span>Score:</span>
              <span className="font-semibold text-[#592538]">
                {getScore()}%
              </span>
            </div>
          )}

          {assessment.completedAt && (
            <div className="text-sm text-gray-500">
              Completed on:{" "}
              {new Date(assessment.completedAt).toLocaleDateString()}
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={() => onViewResults(assessment._id)}
              className="flex-1 px-4 py-2 bg-[#592538] text-white rounded-lg hover:bg-[#6d2c44] transition duration-300"
            >
              View Results
            </button>
            {canRetake() && (
              <button
                onClick={() => onViewResults(assessment._id, true)}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-300"
              >
                Retake
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const AssessmentsPage = () => {
  const [assessments, setAssessments] = useState([]);
  const [completedAssessments, setCompletedAssessments] = useState([]);
  const [hasCommunicationAssessments, setHasCommunicationAssessments] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleStartAssessment = (assessment) => {
    if (!assessment || !assessment.category) {
      console.error('Assessment is missing category');
      return;
    }
    
    // Special handling for Communication Skills Assessment
    if (
      assessment.title === 'Communication Skills Assessment' || 
      assessment.category === 'communication' ||
      assessment.title.toLowerCase().includes('communication')
    ) {
      // Navigate to the communication-assessment route
      navigate('/communication-assessment');
      return;
    }
    
    // Navigate to the assessment details page for other assessments
    navigate(`/assessment/category/${assessment.category}`);
  };

  const handleViewResults = (assessmentId, isRetake = false) => {
    const assessment = assessments.find(a => a._id === assessmentId);
    if (!assessment) return;
    
    if (isRetake) {
      navigate(`/assessment/${assessment.category}`);
    } else {
      navigate(`/assessment/${assessment.category}/recommendations`);
    }
  };

  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        // Decode token to get user ID
        const decodedToken = decodeJWT(token);
        if (!decodedToken || !decodedToken.userId) {
          console.error('Invalid token or missing userId');
          navigate("/login");
          return;
        }

        const userId = decodedToken.userId;
        console.log("Fetching assessments...");
        console.log("User ID from token:", userId);

        // Fetch assessments and their status
        const response = await api.get(`/assessments/status/${userId}`);

        if (!response.data || !response.data.data) {
          throw new Error("Failed to fetch assessments");
        }

        console.log("Assessments response:", response.data.data);
        
        // Set all assessments
        setAssessments(response.data.data.assessments || []);
        
        // Extract completed assessments
        const completed = (response.data.data.assessments || [])
          .filter(a => a.isCompleted)
          .map(a => ({
            _id: a._id,
            assessmentType: a.category,
            score: a.score || 0,
            completedAt: a.completedAt || new Date().toISOString()
          }));
          
        setCompletedAssessments(completed);
        
        // Check if user has completed any communication-related assessments
        const hasCommunication = completed.some(a => 
          ['communication', 'reading', 'writing', 'listening', 'speaking'].includes(a.assessmentType.toLowerCase())
        );
        setHasCommunicationAssessments(hasCommunication);
      } catch (err) {
        console.error("Error fetching assessments:", err);
        setError(err.response?.data?.message || err.message || "Failed to load assessments");
      } finally {
        setLoading(false);
      }
    };

    fetchAssessments();
  }, [navigate]);

  if (loading) {
    return (
      <DashboardLayout title="Completed Assessments">
        <div className="flex items-center justify-center h-64">
          <div className="text-[#592538] text-xl">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Completed Assessments">
        <div className="flex items-center justify-center h-64 flex-col space-y-4">
          <div className="text-red-500 text-xl">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[#592538] text-white rounded-lg hover:bg-[#6d2c44] transition duration-300"
          >
            Try Again
          </button>
        </div>
      </DashboardLayout>
    );
  }

  // Filter out completed assessments
  const availableAssessments = assessments.filter(
    assessment => !completedAssessments.some(ca => ca.assessmentType === assessment.category)
  );

  return (
    <DashboardLayout title="Skill Assessments">
      <div className="space-y-12">
        {/* Available Assessments */}
        <section>
          <h2 className="text-2xl font-semibold text-[#592538] mb-6">
            Available Assessments
          </h2>
          {availableAssessments.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-8 text-center">
              <div className="text-4xl mb-4">🎉</div>
              <h3 className="text-xl font-semibold text-[#592538] mb-2">
                No Available Assessments
              </h3>
              <p className="text-gray-600">
                You've completed all available assessments. Check back later for more!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableAssessments.map((assessment) => (
                <div key={assessment._id} className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold text-[#592538]">
                        {assessment.title}
                      </h3>
                      <span className="text-sm px-3 py-1 rounded-full bg-blue-100 text-blue-800">
                        New
                      </span>
                    </div>

                    <p className="text-gray-600 mb-4">
                      {assessment.description}
                    </p>

                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <span>Duration: {assessment.duration} mins</span>
                    </div>


                    <button
                      onClick={() => handleStartAssessment(assessment)}
                      className="w-full px-4 py-2 bg-[#592538] text-white rounded-lg hover:bg-[#6d2c44] transition duration-300"
                    >
                      Start Assessment
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>


        {/* Completed Assessments */}
        {completedAssessments.length > 0 && (
          <section>
            <h2 className="text-2xl font-semibold text-[#592538] mb-6">
              Your Completed Assessments
            </h2>
            
            {/* Show Communication Overview only if user has completed any communication-related assessments */}
            {hasCommunicationAssessments && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-[#592538] mb-4">
                  Communication Skills Progress
                </h3>
                <CommunicationOverview />
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedAssessments.map((assessment) => (
                <CompletedAssessmentCard
                  key={assessment._id}
                  assessment={assessment}
                  onViewResults={handleViewResults}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AssessmentsPage;
