import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import AssessmentCard from "../components/AssessmentCard";
import api from "../services/api";
import { decodeJWT } from "../utils/jwt";
// import '../styles/Dashboard.css';

const SidebarItem = ({ icon, text, active = false }) => (
  <div className={`sidebar-item ${active ? "active" : ""}`}>
    <span className="sidebar-icon">{icon}</span>
    <span className="sidebar-text">{text}</span>
  </div>
);

const StatCard = ({ icon, value, label }) => (
  <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition duration-300">
    <div className="flex items-center space-x-4">
      <span className="text-3xl">{icon}</span>
      <div>
        <p className="text-2xl font-bold text-[#592538]">{value}</p>
        <p className="text-gray-600">{label}</p>
      </div>
    </div>
  </div>
);

const UserDashboard = () => {
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState([
    { icon: "📊", value: "0", label: "Completed Tests" },
    { icon: "📝", value: "0", label: "Available Tests" },
    { icon: "🎯", value: "0%", label: "Overall Progress" },
    { icon: "⏱️", value: "0", label: "Time Spent" },
  ]);
  const [completedAssessments, setCompletedAssessments] = useState([]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
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
      console.log("Fetching dashboard data...");
      console.log("User ID from token:", userId);

      // Fetch available assessments
      const assessmentsResponse = await api.get("/assessments");
      console.log("Assessments response:", assessmentsResponse.data);

      // Fetch user's assessment status
      const statusResponse = await api.get(
        `/assessments/status/${userId}`
      );
      console.log("Status response:", statusResponse.data);

      const status = statusResponse.data?.data || {};

      // Update stats with safe property access and defaults
      const newStats = [...stats];
      newStats[0].value = (status.totalCompleted || 0).toString(); // Completed Tests
      newStats[1].value = (status.totalAvailable || 0).toString(); // Available Tests
      newStats[2].value = `${Math.round(status.progress || 0)}%`; // Progress
      setStats(newStats);

      // Show all assessments, not just available ones
      setAssessments(assessmentsResponse.data);

      setLoading(false);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      console.error("Error response:", error.response);
      setError("Failed to load dashboard data. Please try again.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Add event listener for storage changes
    const handleStorageChange = (e) => {
      if (e.key === "assessmentStatus") {
        fetchDashboardData(); // Refresh dashboard data when assessment status changes
      }
    };

    window.addEventListener("storage", handleStorageChange);

    // Cleanup
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [navigate]);

  // Handler for viewing results
  const handleViewResults = (assessment) => {
    navigate(`/assessment/${assessment.category || assessment.assessmentType}/recommendations`);
  };

  const handleRetry = () => {
    fetchDashboardData();
  };

  if (loading) {
    return (
      <DashboardLayout title="Dashboard Overview">
        <div className="flex justify-center items-center h-64">
          <div className="text-[#592538] text-xl">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Dashboard Overview">
        <div className="flex flex-col items-center justify-center h-64 bg-white p-8 rounded-xl shadow-md">
          <div className="text-[#592538] text-xl mb-4">{error}</div>
          <button
            onClick={handleRetry}
            className="px-6 py-3 bg-[#592538] text-white rounded-lg hover:bg-[#6d2c44] transition duration-300"
          >
            Try Again
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Dashboard Overview">
      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Assessments Section */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-2xl font-bold text-[#592538] mb-6">
          Your Assessments
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assessments.length > 0 ? (
            assessments.map((assessment) => (
              <AssessmentCard
                key={assessment._id || assessment.assessmentType}
                assessment={assessment}
                onViewResults={handleViewResults}
              />
            ))
          ) : (
            <div className="col-span-3 text-center py-8 text-gray-500">
              No assessments available at the moment.
            </div>
          )}
        </div>
      </div>

      {/* Test Page Link */}
      <div className="mt-8 bg-white rounded-xl shadow-md p-6">
        <h2 className="text-2xl font-bold text-[#592538] mb-6">Test Pages</h2>
        <button
          onClick={() => navigate("/presentation-fetch")}
          className="px-6 py-3 bg-[#592538] text-white rounded-lg hover:bg-[#6d2c44] transition duration-300"
        >
          Test Presentation Videos
        </button>
      </div>
    </DashboardLayout>
  );
};

export default UserDashboard;
