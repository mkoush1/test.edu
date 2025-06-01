import React, { useState, useRef, useEffect } from 'react';

const SpeakingAssessment = ({ onComplete }) => {
  const [currentPrompt, setCurrentPrompt] = useState(0);
  const [recordings, setRecordings] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [stream, setStream] = useState(null);
  const videoRef = useRef(null);

  const prompts = [
    {
      id: 1,
      title: 'Impromptu Presentation',
      description: 'You have 60 seconds to prepare a 2-minute talk on the topic: "The most important skill for success in the 21st century."',
      prepTime: 60,
      recordTime: 120,
      criteria: ['Coherence', 'Fluency', 'Articulation', 'Confidence']
    },
    {
      id: 2,
      title: 'Explaining a Complex Concept',
      description: 'Explain the concept of "blockchain technology" to someone with no technical background in under 3 minutes.',
      prepTime: 90,
      recordTime: 180,
      criteria: ['Clarity', 'Coherence', 'Tone', 'Articulation']
    },
    {
      id: 3,
      title: 'Handling a Difficult Question',
      description: 'Your manager asks: "Why was your part of the project delayed?" Respond professionally in under 2 minutes.',
      prepTime: 45,
      recordTime: 120,
      criteria: ['Tone', 'Coherence', 'Fluency', 'Persuasiveness']
    }
  ];

  useEffect(() => {
    if (timeLeft === 0) {
      if (isRecording) {
        stopRecording();
      } else {
        handleNextPrompt();
      }
    }
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft, isRecording]);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: true,
        audio: true 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      return mediaStream;
    } catch (err) {
      console.error("Error accessing camera:", err);
      return null;
    }
  };

  const startPreparationTimer = async () => {
    const currentPromptObj = prompts[currentPrompt];
    setTimeLeft(currentPromptObj.prepTime);
    await startCamera();
  };

  const startRecording = async () => {
    if (!stream) {
      const mediaStream = await startCamera();
      if (!mediaStream) return;
    }

    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    setMediaRecorder(recorder);
    
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        setRecordedChunks(prev => [...prev, event.data]);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const newRecordings = [...recordings];
      newRecordings[currentPrompt] = url;
      setRecordings(newRecordings);
      setRecordedChunks([]);
    };

    recorder.start();
    setIsRecording(true);
    setTimeLeft(prompts[currentPrompt].recordTime);
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const handleNextPrompt = () => {
    if (isRecording) {
      stopRecording();
    }

    if (currentPrompt < prompts.length - 1) {
      setCurrentPrompt(currentPrompt + 1);
      setTimeLeft(null);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    } else {
      calculateResults();
    }
  };

  const calculateResults = () => {
    // In a real implementation, this would use AI speech analysis
    // For now, we'll simulate a basic scoring system
    const scores = prompts.map((prompt, index) => {
      if (!recordings[index]) return { promptId: prompt.id, criteriaScores: [], averageScore: 0 };
      
      // Simulate criteria scores
      const criteriaScores = prompt.criteria.map(() => Math.floor(Math.random() * 30) + 70);
      
      return {
        promptId: prompt.id,
        criteriaScores,
        averageScore: criteriaScores.reduce((a, b) => a + b, 0) / criteriaScores.length
      };
    });

    const completedScores = scores.filter(score => score.averageScore > 0);
    const overallScore = completedScores.length > 0 
      ? completedScores.reduce((total, score) => total + score.averageScore, 0) / completedScores.length
      : 0;

    const results = {
      type: 'speaking',
      score: overallScore,
      totalPrompts: prompts.length,
      completedPrompts: completedScores.length,
      promptScores: scores,
      recordings,
      feedback: generateFeedback(overallScore)
    };

    onComplete(results);
  };

  const generateFeedback = (score) => {
    if (score >= 90) {
      return 'Excellent speaking skills! You demonstrate clear articulation, fluent delivery, and confident presentation.';
    } else if (score >= 70) {
      return 'Good speaking skills. Your delivery is clear and well-structured, with room for improvement in some areas.';
    } else if (score >= 50) {
      return 'Developing speaking skills. Focus on fluency, reducing filler words, and organizing your thoughts more clearly.';
    } else {
      return 'Basic speaking skills. Consider practicing with regular speaking exercises to build confidence and fluency.';
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const currentPromptObj = prompts[currentPrompt];

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">
          Prompt {currentPrompt + 1} of {prompts.length}: {currentPromptObj.title}
        </h2>
        <div className="mb-4">
          <p className="text-lg mb-4">{currentPromptObj.description}</p>
          {timeLeft !== null && (
            <div className="text-right text-gray-600 mb-4">
              {isRecording ? 'Recording' : 'Preparation'} time remaining: {formatTime(timeLeft)}
            </div>
          )}
        </div>
        <div className="mb-6">
          <div className="relative aspect-video bg-gray-200 mb-4 rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              muted={isRecording} // Only mute during recording to prevent feedback
            />
            {!stream && !recordings[currentPrompt] && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-gray-500">Camera preview will appear here</p>
              </div>
            )}
            {recordings[currentPrompt] && !stream && (
              <video 
                src={recordings[currentPrompt]} 
                className="w-full h-full object-cover" 
                controls 
              />
            )}
          </div>
          <div className="flex space-x-4">
            {!timeLeft && !recordings[currentPrompt] && (
              <button
                onClick={startPreparationTimer}
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                Begin Preparation
              </button>
            )}
            {timeLeft === 0 && !isRecording && !recordings[currentPrompt] && (
              <button
                onClick={startRecording}
                className="bg-red-500 text-white px-4 py-2 rounded"
              >
                Start Recording
              </button>
            )}
            {isRecording && (
              <button
                onClick={stopRecording}
                className="bg-gray-700 text-white px-4 py-2 rounded"
              >
                Stop Recording
              </button>
            )}
            {recordings[currentPrompt] && (
              <button
                onClick={() => {
                  const newRecordings = [...recordings];
                  newRecordings[currentPrompt] = null;
                  setRecordings(newRecordings);
                }}
                className="bg-yellow-500 text-white px-4 py-2 rounded"
              >
                Re-record
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="flex justify-between">
        <button
          onClick={() => {
            if (isRecording) stopRecording();
            setCurrentPrompt(Math.max(0, currentPrompt - 1));
            setTimeLeft(null);
            if (stream) {
              stream.getTracks().forEach(track => track.stop());
              setStream(null);
            }
          }}
          disabled={currentPrompt === 0}
          className="bg-gray-500 text-white px-4 py-2 rounded disabled:bg-gray-300"
        >
          Previous
        </button>
        <button
          onClick={handleNextPrompt}
          className="bg-green-500 text-white px-4 py-2 rounded"
          disabled={!recordings[currentPrompt] && currentPrompt !== prompts.length - 1}
        >
          {currentPrompt === prompts.length - 1 ? 'Finish' : 'Next'}
        </button>
      </div>
    </div>
  );
};

export default SpeakingAssessment; 