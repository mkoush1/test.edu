import React from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import AssessmentCard from "../components/AssessmentCard";

const ProblemSolvingAssessment = () => {
  const navigate = useNavigate();

  const problemSolvingAssessments = [
    {
      _id: "fast-questions",
      title: "Fast Questions Assessment",
      description: "Test your quick problem-solving abilities with time-limited questions",
      category: "Problem Solving",
      duration: 50,
      image: "/eduSoft_logo.png"
    },
    {
      _id: "puzzle-game",
      title: "Puzzle Game Assessment",
      description: "Solve engaging puzzles to demonstrate your logical thinking skills",
      category: "Problem Solving",
      duration: 4,
      image: "/eduSoft_logo.png"
    },
    {
      _id: "codeforces-link",
      title: "Link LeetCode Account",
      description: "Connect your Codeforces account to track your competitive programming progress",
      category: "Problem Solving",
      duration: 5,
      image: "/eduSoft_logo.png"
    }
  ];

  return (
    <DashboardLayout title="Problem Solving Skills Assessment">
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[#592538]">
            Choose an Assessment Type
          </h2>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-[#592538] text-white rounded-lg hover:bg-[#4a1f2e] transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {problemSolvingAssessments.map((assessment) => (
            <AssessmentCard key={assessment._id} assessment={assessment} />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProblemSolvingAssessment; 