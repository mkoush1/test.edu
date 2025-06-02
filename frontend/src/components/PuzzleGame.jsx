import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const PuzzleGame = ({ initialPuzzle, assessmentId }) => {
  const navigate = useNavigate();
  const [puzzle, setPuzzle] = useState(initialPuzzle);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timer, setTimer] = useState(240); // 4 minutes in seconds
  const [timerInterval, setTimerInterval] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const TIME_LIMIT = 4 * 60; // 4 minutes in seconds
  const [isPaused, setIsPaused] = useState(false);
  const [savedState, setSavedState] = useState(null);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [score, setScore] = useState(0);
  const [scoreMessage, setScoreMessage] = useState('');

  useEffect(() => {
    startTimer();
    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, []);

  // Check time limit
  useEffect(() => {
    if (timer >= TIME_LIMIT && !puzzle?.isCompleted) {
      clearInterval(timerInterval);
      submitAssessment(puzzle);
    }
  }, [timer, puzzle]);

  // Check if time is up
  useEffect(() => {
    if (timer <= 0 && !isPaused) {
      handleTimeUp();
    }
  }, [timer]);

  const calculateScore = (timeInSeconds, moves) => {
    const timeInMinutes = timeInSeconds / 60;
    const maxMoves = 50; // Define what "few moves" means
    const moveFactor = Math.max(0, 1 - (moves / maxMoves));

    let baseScore;
    if (timeInMinutes <= 1) {
      baseScore = 100;
    } else if (timeInMinutes <= 2) {
      baseScore = 85;
    } else if (timeInMinutes <= 3) {
      baseScore = 70;
    } else {
      baseScore = 50;
    }

    // Adjust score based on moves
    const finalScore = Math.round(baseScore * (0.7 + (0.3 * moveFactor)));
    
    // Set score message
    if (finalScore === 100) {
      setScoreMessage("Excellent! Perfect score! You're a puzzle master!");
    } else if (finalScore >= 85) {
      setScoreMessage("Very good! You're really good at this!");
    } else if (finalScore >= 70) {
      setScoreMessage("Good job! You can do even better next time!");
    } else {
      setScoreMessage("Keep practicing! You can improve your score!");
    }

    return finalScore;
  };

  const handleTimeUp = async () => {
    clearInterval(timerInterval);
    setIsTimeUp(true);
    const finalScore = calculateScore(240 - timer, puzzle.moves);
    setScore(finalScore);
    // Submit the assessment with the current state
    await submitAssessment({
      ...puzzle,
      isCompleted: true,
      timeUp: true,
      score: finalScore
    });
  };

  const startTimer = () => {
    if (timerInterval) clearInterval(timerInterval);
    setTimer(240); // Reset to 4 minutes
    const interval = setInterval(() => {
      if (!isPaused) {
        setTimer(prev => {
          if (prev <= 0) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);
    setTimerInterval(interval);
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Update valid moves whenever puzzle state changes
  useEffect(() => {
    if (!puzzle) return;

    const currentState = puzzle.currentState;
    const size = puzzle.size;
    let emptyRow, emptyCol;
    const newValidMoves = [];

    // Find empty cell (0)
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        if (currentState[i][j] === 0) {
          emptyRow = i;
          emptyCol = j;
          break;
        }
      }
    }

    // Find valid moves (adjacent to empty cell)
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        if (Math.abs(i - emptyRow) + Math.abs(j - emptyCol) === 1) {
          newValidMoves.push(`${i},${j}`);
        }
      }
    }

    setValidMoves(newValidMoves);
  }, [puzzle]);

  const togglePause = () => {
    if (isPaused) {
      // Resume game
      setIsPaused(false);
      setSavedState(null);
    } else {
      // Pause game
      setIsPaused(true);
      setSavedState({
        currentState: puzzle.currentState,
        moves: puzzle.moves,
        time: timer
      });
    }
  };

  const makeMove = async (row, col) => {
    if (!puzzle || puzzle.isCompleted || isPaused || isTimeUp) return;
    
    // Don't allow clicking on the empty cell
    if (puzzle.currentState[row][col] === 0) {
      console.log('Clicked on empty cell');
      return;
    }

    // Check if move is valid
    if (!validMoves.includes(`${row},${col}`)) {
      // Instead of showing error, just ignore invalid moves
      console.log('Invalid move ignored');
      return;
    }

    console.log('Attempting move:', { row, col });
    console.log('Current puzzle state:', puzzle.currentState);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:5000/api/puzzle/${puzzle._id}/move`,
        { row, col },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('Move successful:', response.data);
      setPuzzle(response.data);
      setError(null);

      if (response.data.isCompleted) {
        clearInterval(timerInterval);
        await submitAssessment(response.data);
      }
    } catch (error) {
      console.error('Error making move:', error);
      // Don't show error message for invalid moves
      if (error.response?.status !== 400) {
        setError(error.response?.data?.message || 'Failed to make move');
      }
    }
  };

  const submitAssessment = async (completedPuzzle) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const finalScore = calculateScore(240 - timer, completedPuzzle.moves);
      setScore(finalScore);

      const response = await axios.post(
        'http://localhost:5000/api/assessments/submit/puzzle-game',
        {
          puzzleData: [{
            puzzleId: completedPuzzle._id,
            difficulty: 'medium',
            moves: completedPuzzle.moves,
            timeTaken: 240 - timer,
            completed: true,
            score: finalScore
          }]
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success) {
        // Update local storage with the new assessment status
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        if (userData) {
          userData.completedAssessments = response.data.result.assessmentStatus.completedAssessments;
          userData.totalAssessmentsCompleted = response.data.result.assessmentStatus.totalCompleted;
          userData.progress = response.data.result.assessmentStatus.progress;
          localStorage.setItem('userData', JSON.stringify(userData));
        }

        // Update puzzle state with score and rating
        setPuzzle(prev => ({
          ...prev,
          isCompleted: true,
          score: response.data.result.score,
          rating: response.data.result.rating,
          completionTime: response.data.result.completionTime
        }));

        // Show success message
        setError(null);
      } else {
        setError('Failed to submit assessment');
      }
    } catch (error) {
      console.error('Error submitting assessment:', error);
      setError(error.response?.data?.message || 'Failed to submit assessment');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = useCallback((e) => {
    if (!puzzle || puzzle.isCompleted) return;

    const currentState = puzzle.currentState;
    const size = puzzle.size;
    let emptyRow, emptyCol;

    // Find empty cell (0)
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        if (currentState[i][j] === 0) {
          emptyRow = i;
          emptyCol = j;
          break;
        }
      }
    }

    switch (e.key) {
      case 'ArrowUp':
        if (emptyRow < size - 1) makeMove(emptyRow + 1, emptyCol);
        break;
      case 'ArrowDown':
        if (emptyRow > 0) makeMove(emptyRow - 1, emptyCol);
        break;
      case 'ArrowLeft':
        if (emptyCol < size - 1) makeMove(emptyRow, emptyCol + 1);
        break;
      case 'ArrowRight':
        if (emptyCol > 0) makeMove(emptyRow, emptyCol - 1);
        break;
      default:
        break;
    }
  }, [puzzle]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <div className="text-xl text-gray-800">Submitting assessment...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <div className="text-xl text-red-600 mb-4">{error}</div>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Slide Puzzle</h1>
          <div className="text-gray-600">
            Moves: {puzzle?.moves} | Time: {formatTime(timer)}
          </div>
        </div>

        {/* Only show non-validation errors */}
        {error && !error.includes('Invalid move') && (
          <div className="mb-4 p-2 bg-red-100 text-red-600 rounded">
            {error}
          </div>
        )}

        {isPaused && (
          <div className="mb-4 p-4 bg-yellow-100 text-yellow-800 rounded-lg text-center">
            <p className="font-bold">Game Paused</p>
            <p>Moves: {savedState?.moves} | Time: {formatTime(savedState?.time)}</p>
          </div>
        )}

        {isTimeUp && (
          <div className="mb-4 p-4 bg-red-100 text-red-800 rounded-lg text-center">
            <p className="font-bold">Time's Up!</p>
            <p>Game Over - You ran out of time</p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 bg-gray-200 p-2 rounded-lg">
          {puzzle?.currentState.map((row, i) => (
            row.map((cell, j) => (
              <button
                key={`${i}-${j}`}
                className={`w-20 h-20 flex items-center justify-center text-2xl font-bold rounded-lg
                  ${cell === 0 ? 'bg-transparent' : 'bg-white hover:bg-gray-100'}
                  ${validMoves.includes(`${i},${j}`) ? 'ring-2 ring-blue-500' : ''}
                  ${(puzzle.isCompleted || isPaused || isTimeUp) ? 'cursor-default' : 'cursor-pointer'}`}
                onClick={() => !puzzle.isCompleted && !isPaused && !isTimeUp && makeMove(i, j)}
                disabled={cell === 0 || puzzle.isCompleted || isPaused || isTimeUp}
              >
                {cell !== 0 && cell}
              </button>
            ))
          ))}
        </div>

        {!puzzle?.isCompleted && !isTimeUp && (
          <div className="mt-6 space-y-2">
            <button
              onClick={togglePause}
              className={`w-full px-4 py-2 rounded-lg ${
                isPaused 
                  ? 'bg-green-500 hover:bg-green-600 text-white' 
                  : 'bg-yellow-500 hover:bg-yellow-600 text-white'
              }`}
            >
              {isPaused ? 'Resume Game' : 'Pause Game'}
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              Back to Dashboard
            </button>
          </div>
        )}

        {(puzzle?.isCompleted || isTimeUp) && (
          <div className="mt-6 text-center">
            <p className={`text-xl font-bold mb-4 ${isTimeUp ? 'text-red-600' : 'text-green-600'}`}> 
              {isTimeUp ? "Time's Up!" : "Congratulations! You solved the puzzle!"}
            </p>
            <p className="text-gray-600 mb-4">
              Moves: {puzzle.moves} | Time: {formatTime(timer)}
            </p>
            <p className="text-gray-600 mb-4">
              Score: {score} points
            </p>
            <p className={`text-lg font-semibold mb-4 ${
              score === 100 ? 'text-green-600' : 
              score >= 85 ? 'text-blue-600' : 
              score >= 70 ? 'text-yellow-600' : 
              'text-orange-600'
            }`}>
              {scoreMessage}
            </p>
            <p className="text-gray-600 mb-4">
              Rating: {puzzle.rating || 'Calculating...'}
            </p>
            <p className="text-gray-600 mb-4">
              Completion Time: {puzzle.completionTime || (timer / 60).toFixed(2)} minutes
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Back to Dashboard
              </button>
              <button
                onClick={() => navigate('/assessment/recommendations')}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                View Recommendations
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PuzzleGame; 