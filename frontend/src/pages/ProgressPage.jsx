import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import axios from "axios";
import { decodeJWT } from "../utils/jwt";
import api from "../services/api"; // Import the configured API client

const ProgressPage = () => {
  const navigate = useNavigate();
  const [completedAssessments, setCompletedAssessments] = useState([]);
  const [totalCompleted, setTotalCompleted] = useState(0);
  const [totalAvailable, setTotalAvailable] = useState(0);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        // Decode token to get user ID
        const decodedToken = decodeJWT(token);
        if (!decodedToken || !decodedToken.userId) {
          console.error("Invalid token or missing userId");
          navigate("/login");
          return;
        }

        const userId = decodedToken.userId;

        // Use the configured API client instead of direct axios
        const response = await api.get(`/assessments/status/${userId}`);

        if (!response.data || !response.data.data) {
          throw new Error("Failed to fetch progress data");
        }

        const completedData = response.data.data.completedAssessments || [];
        setCompletedAssessments(completedData);
        setTotalCompleted(response.data.data.totalCompleted || 0);
        setTotalAvailable(response.data.data.totalAvailable || 0);
        setProgress(response.data.data.progress || 0);
      } catch (error) {
        console.error("Error fetching progress:", error);
        setError("Failed to fetch progress data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [navigate]);

  const calculateAverageScore = () => {
    if (completedAssessments.length === 0) return 0;
    const totalScore = completedAssessments.reduce(
      (sum, assessment) => sum + assessment.score,
      0
    );
    return Math.round(totalScore / completedAssessments.length);
  };

  if (loading) {
    return (
      <DashboardLayout title="Progress Overview">
        <div className="flex items-center justify-center h-64">
          <div className="text-[#592538] text-xl">Loading progress...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Progress Overview">
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

  return (
    <DashboardLayout title="Progress Overview">
      <div className="space-y-6 sm:space-y-8">
        {/* Progress Stats */}
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 lg:p-8">
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0">
              <h2 className="text-xl sm:text-2xl font-semibold text-[#592538]">
                Overall Progress
              </h2>
              <span className="text-3xl sm:text-4xl font-bold text-[#592538]">
                {Math.round(progress)}%
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0">
              <h2 className="text-xl sm:text-2xl font-semibold text-[#592538]">
                Completed Assessments
              </h2>
              <span className="text-3xl sm:text-4xl font-bold text-[#592538]">
                {totalCompleted}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0">
              <h2 className="text-xl sm:text-2xl font-semibold text-[#592538]">
                Average Score
              </h2>
              <span className="text-3xl sm:text-4xl font-bold text-[#592538]">
                {calculateAverageScore()}%
              </span>
            </div>
          </div>
        </div>

        {/* Assessment Progress */}
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 lg:p-8">
          <h2 className="text-xl sm:text-2xl font-semibold text-[#592538] mb-4 sm:mb-6">
            Assessment Progress
          </h2>
          <div className="space-y-4 sm:space-y-6">
            {completedAssessments.map((assessment) => (
              <div
                key={assessment._id}
                className="border rounded-lg p-4 sm:p-6 hover:shadow-md transition duration-300"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
                  <div>
                    <h3 className="text-lg sm:text-xl font-medium text-[#592538] capitalize">
                      {assessment.assessmentType} Assessment
                    </h3>
                    <p className="text-gray-600 text-sm sm:text-base">
                      {new Date(assessment.completedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-3 py-1 rounded-full text-sm sm:text-base ${
                        assessment.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {assessment.status === "completed"
                        ? "Completed"
                        : "In Progress"}
                    </span>
                    {assessment.score && (
                      <span className="text-lg sm:text-xl font-semibold text-[#592538]">
                        {Math.round(assessment.score)}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-[#592538] h-2.5 rounded-full"
                      style={{ width: `${assessment.progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProgressPage;
