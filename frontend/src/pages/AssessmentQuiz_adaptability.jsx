import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
// import '../styles/AssessmentQuiz.css';
// import { submitAssessment } from "../services/api";

const AssessmentQuizAdaptability = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [error, setError] = useState("");

  // Force check for token at the very start
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.log("[DEBUG] No token found in localStorage. Redirecting to login.");
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    const startAssessment = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Please log in to take the assessment");
          setLoading(false);
          navigate("/login");
          return;
        }
        console.log("[DEBUG] Token found:", token);
        // Fetch questions from backend using POST and shared api instance
        const response = await api.post("/assessments/start/adaptability");
        console.log("[DEBUG] Response from /assessments/start/adaptability:", response);
        if (response.data && response.data.questions && response.data.questions.length > 0) {
          setQuestions(response.data.questions);
          setTimeLeft(45 * 60); // 45 minutes in seconds
        } else {
          setError("No questions available. Please try again later.");
        }
        setLoading(false);
      } catch (err) {
        console.error("[DEBUG] Error fetching questions:", err);
        if (err.response?.status === 401 || err.response?.status === 403) {
          setError("Your session has expired. Please log in again.");
          localStorage.removeItem("token");
          navigate("/login");
        } else {
          setError("Failed to load questions. Please try again later.");
        }
        setLoading(false);
      }
    };
    startAssessment();
  }, [navigate]);

  useEffect(() => {
    if (!loading && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    }
    if (timeLeft === 0) {
      handleSubmit();
    }
    // eslint-disable-next-line
  }, [timeLeft, loading]);

  const handleAnswer = (selectedIdx) => {
    setAnswers({
      ...answers,
      [questions[currentQuestionIndex].questionNumber]: selectedIdx,
    });
  };

  const handleNext = () => {
    setCurrentQuestionIndex((prev) => prev + 1);
  };

  const handlePrevious = () => {
    setCurrentQuestionIndex((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please log in to submit the assessment");
        setLoading(false);
        navigate("/login");
        return;
      }
      // Format answers for submission
      const formattedAnswers = Object.entries(answers).map(
        ([questionNumber, selectedIdx]) => ({
          questionNumber: parseInt(questionNumber),
          answer: questions.find(q => q.questionNumber === parseInt(questionNumber)).options[selectedIdx].value,
        })
      );
      // Submit answers to backend
      const response = await api.post(
        "/assessments/submit/adaptability",
        {
          answers: formattedAnswers,
        }
      );
      if (response.data.result && response.data.result.assessmentStatus) {
        localStorage.setItem(
          "assessmentStatus",
          JSON.stringify(response.data.result.assessmentStatus)
        );
      }
      navigate("/dashboard");
    } catch (error) {
      console.error("[DEBUG] Error submitting assessment:", error);
      setError("Failed to submit assessment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDF8F8] flex items-center justify-center">
        <div className="text-[#592538] text-xl">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#FDF8F8] flex items-center justify-center">
        <div className="text-[#592538] text-xl">{error}</div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-[#FDF8F8] flex items-center justify-center">
        <div className="text-[#592538] text-xl">No questions available</div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-[#FDF8F8] py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg mb-6 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-2xl font-bold text-[#592538]">
              Adaptability & Flexibility Assessment
            </h1>
            <div className="flex items-center gap-2 text-[#592538]">
              <span className="text-lg">⏱️</span>
              <span className="font-semibold">{formatTime(timeLeft)}</span>
            </div>
          </div>
        </div>
        {/* Question Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          {/* Progress */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
              <span>{currentQuestion.section}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-[#592538] h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
                }}
              ></div>
            </div>
          </div>
          {/* Question */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-[#592538] mb-6">
              {currentQuestion.questionText}
            </h2>
            {/* Options */}
            <div className="space-y-4">
              {currentQuestion.options.map((option, idx) => (
                <button
                  key={option.text + idx}
                  onClick={() => handleAnswer(idx)}
                  className={`
                    w-full p-4 text-left rounded-lg transition duration-300
                    ${
                      answers[currentQuestion.questionNumber] === idx
                        ? "bg-[#592538] text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-[#592538]/10"
                    }
                  `}
                >
                  <span className="font-medium mr-2">{String.fromCharCode(65 + idx)}.</span>
                  {option.text}
                </button>
              ))}
            </div>
          </div>
          {/* Navigation */}
          <div className="flex flex-wrap gap-4">
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className={`
                flex-1 px-6 py-3 rounded-lg font-medium transition duration-300
                ${
                  currentQuestionIndex === 0
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-gray-100 text-[#592538] hover:bg-gray-200"
                }
              `}
            >
              Previous
            </button>
            {currentQuestionIndex === questions.length - 1 ? (
              <button
                onClick={handleSubmit}
                disabled={answers[currentQuestion.questionNumber] === undefined}
                className={`
                  flex-1 px-6 py-3 rounded-lg font-medium transition duration-300
                  ${
                    answers[currentQuestion.questionNumber] === undefined
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-[#592538] text-white hover:bg-[#6d2c44]"
                  }
                `}
              >
                Submit Assessment
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={answers[currentQuestion.questionNumber] === undefined}
                className={`
                  flex-1 px-6 py-3 rounded-lg font-medium transition duration-300
                  ${
                    answers[currentQuestion.questionNumber] === undefined
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-[#592538] text-white hover:bg-[#6d2c44]"
                  }
                `}
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssessmentQuizAdaptability; 