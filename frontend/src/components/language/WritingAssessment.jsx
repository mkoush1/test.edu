import React, { useState, useEffect, useRef } from 'react';
import CEFRService from '../../services/cefr.service';
import WritingAssessmentService from '../../services/writingAssessment.service';
import AssessmentService from '../../services/assessment.service';

const WritingAssessment = ({ onComplete, level, language, onBack }) => {
  console.log("WritingAssessment component rendered with:", { level, language });
  
  const [currentTask, setCurrentTask] = useState(0);
  const [responses, setResponses] = useState([]);
  const [timeLeft, setTimeLeft] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [timerActive, setTimerActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [aiEvaluationResults, setAiEvaluationResults] = useState([]);
  const [error, setError] = useState(null);
  const [canTakeAssessment, setCanTakeAssessment] = useState(true);
  const [nextAvailableDate, setNextAvailableDate] = useState(null);
  const [previousAssessments, setPreviousAssessments] = useState([]);
  const [showPreviousResults, setShowPreviousResults] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [promptLoading, setPromptLoading] = useState(false);
  
  // Add a ref to track if prompt generation is in progress
  const isGeneratingPrompt = useRef(false);
  // Add a ref to store the last generated prompt
  const lastGeneratedPrompt = useRef(null);
  // Add a ref for the current level and language
  const currentParams = useRef({ level, language });

  useEffect(() => {
    // Check if user can take this assessment
    const checkAssessmentAvailability = async () => {
      try {
        setLoading(true);
        const response = await AssessmentService.checkWritingAssessmentAvailability(level, language);
        if (response.success) {
          setCanTakeAssessment(response.available);
          if (!response.available) {
            setNextAvailableDate(new Date(response.nextAvailableDate));
            // If we have the last assessment data, show it
            if (response.lastAssessment) {
              setSelectedAssessment({
                prompt: response.lastAssessment.prompt,
                response: response.lastAssessment.response,
                score: response.lastAssessment.score,
                completedAt: new Date(response.lastAssessment.completedAt),
                criteria: response.lastAssessment.criteria
              });
              setShowPreviousResults(true);
            }
          }
        }
        setLoading(false);
      } catch (error) {
        console.error("Error checking assessment availability:", error);
        // Default to allowing assessment if there's an error checking
        setCanTakeAssessment(true);
        setLoading(false);
      }
    };

    // Get user's previous assessments for this level and language
    const getUserAssessments = async () => {
      try {
        const response = await AssessmentService.getUserWritingAssessments();
        if (response.success && response.assessments) {
          // Filter assessments for current level and language
          const filteredAssessments = response.assessments.filter(
            assessment => assessment.level === level && assessment.language === language
          );
          setPreviousAssessments(filteredAssessments);
        }
      } catch (error) {
        console.error("Error fetching user assessments:", error);
      }
    };

    // Run both checks
    const initializeAssessment = async () => {
      await checkAssessmentAvailability();
      await getUserAssessments();
    };

    initializeAssessment();
  }, [level, language]);

  useEffect(() => {
    // Reset when level or language changes
    if (currentParams.current.level !== level || currentParams.current.language !== language) {
      console.log("Level or language changed, resetting prompt state");
      lastGeneratedPrompt.current = null;
      currentParams.current = { level, language };
    }
    
    // Load tasks based on language and level
    const loadTasks = async () => {
      try {
        console.log("Starting to load writing tasks for:", { level, language });
        setLoading(true);
        setPromptLoading(true);
        setError(null);
        
        // Check if user can take the assessment first
        const availabilityResponse = await AssessmentService.checkWritingAssessmentAvailability(level, language);
        
        // If user can't take the assessment, don't generate a prompt
        if (availabilityResponse.success && !availabilityResponse.available) {
          console.log("User cannot take assessment, skipping prompt generation");
          setLoading(false);
          setPromptLoading(false);
          setCanTakeAssessment(false);
          if (availabilityResponse.nextAvailableDate) {
            setNextAvailableDate(new Date(availabilityResponse.nextAvailableDate));
          }
          
          // If we have the last assessment data, show it
          if (availabilityResponse.lastAssessment) {
            setSelectedAssessment({
              prompt: availabilityResponse.lastAssessment.prompt,
              response: availabilityResponse.lastAssessment.response,
              score: availabilityResponse.lastAssessment.score,
              completedAt: new Date(availabilityResponse.lastAssessment.completedAt),
              criteria: availabilityResponse.lastAssessment.criteria
            });
            setShowPreviousResults(true);
          }
          return;
        }
        
        // Check if we're already generating a prompt
        if (isGeneratingPrompt.current) {
          console.log("Prompt generation already in progress, skipping duplicate request");
          return;
        }
        
        // Check if we already have a prompt for this level and language
        if (lastGeneratedPrompt.current && 
            lastGeneratedPrompt.current.level === level && 
            lastGeneratedPrompt.current.language === language) {
          console.log("Using cached prompt from previous generation");
          const cachedPrompt = lastGeneratedPrompt.current.prompt;
          
          // Create task from the cached prompt
          const assessmentData = {
            tasks: [{
              id: 1,
              title: cachedPrompt.title,
              prompt: cachedPrompt.prompt,
              timeLimit: cachedPrompt.timeLimit * 60, // Convert minutes to seconds
              wordLimit: cachedPrompt.wordLimit,
              criteria: cachedPrompt.criteria,
              isDynamicallyGenerated: true
            }]
          };
          
          setTasks(assessmentData.tasks);
          // Initialize responses array
          setResponses(new Array(assessmentData.tasks.length).fill(''));
          // Initialize AI evaluation results array
          setAiEvaluationResults(new Array(assessmentData.tasks.length).fill(null));
          setLoading(false);
          setPromptLoading(false);
          return;
        }
        
        // Mark that we're generating a prompt
        isGeneratingPrompt.current = true;
        
        // Add a timeout to prevent infinite loading
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timed out')), 30000) // Increased timeout to 30 seconds
        );
        
        // Try to fetch assessment data with a timeout
        let assessmentData;
        try {
          console.log("Attempting to get assessment data via prompt generation API...");
          
          // Generate a dynamic prompt using AI
          console.log("Calling WritingAssessmentService.generatePrompt with:", { level, language });
          const generatedPromptPromise = WritingAssessmentService.generatePrompt(level, language);
          
          // Add more detailed logging for the API call
          generatedPromptPromise.then(
            result => console.log("API call succeeded:", { 
              title: result?.title,
              promptLength: result?.prompt?.length || 0,
              timeLimit: result?.timeLimit,
              wordLimit: result?.wordLimit,
              criteria: result?.criteria?.join(', ')
            }),
            error => console.error("API call failed:", error)
          );
          
          const generatedPrompt = await Promise.race([
            generatedPromptPromise,
            timeoutPromise
          ]);
          
          if (!generatedPrompt) {
            throw new Error("Failed to generate AI writing prompt. The service may be temporarily unavailable.");
          }
          
          // Check if this is a previous assessment prompt and user can't take the assessment
          if (generatedPrompt.isLastAssessment) {
            console.log("Received prompt from previous assessment, user cannot take assessment");
            setCanTakeAssessment(false);
            if (generatedPrompt.nextAvailableDate) {
              setNextAvailableDate(new Date(generatedPrompt.nextAvailableDate));
            }
            setLoading(false);
            setPromptLoading(false);
            isGeneratingPrompt.current = false;
            return;
          }
          
          console.log("Generated prompt received:", {
            title: generatedPrompt.title,
            promptLength: generatedPrompt.prompt?.length || 0,
            timeLimit: generatedPrompt.timeLimit,
            wordLimit: generatedPrompt.wordLimit,
            criteria: generatedPrompt.criteria?.join(', ')
          });
          
          // Store the generated prompt in our ref
          lastGeneratedPrompt.current = {
            level,
            language,
            prompt: generatedPrompt
          };
          
          // Create task from the generated prompt
          assessmentData = {
            tasks: [{
              id: 1,
              title: generatedPrompt.title,
              prompt: generatedPrompt.prompt,
              timeLimit: generatedPrompt.timeLimit * 60, // Convert minutes to seconds
              wordLimit: generatedPrompt.wordLimit,
              criteria: generatedPrompt.criteria,
              isDynamicallyGenerated: true
            }]
          };
          
          console.log("Assessment data created from generated prompt:", { 
            success: !!assessmentData, 
            hasTasks: assessmentData?.tasks?.length > 0,
            taskCount: assessmentData?.tasks?.length || 0,
            title: assessmentData?.tasks?.[0]?.title,
            prompt: assessmentData?.tasks?.[0]?.prompt?.substring(0, 50) + "..."
          });
        } catch (fetchError) {
          console.error("Error or timeout fetching assessment data:", fetchError);
          console.error("Error details:", {
            message: fetchError.message,
            stack: fetchError.stack,
            response: fetchError.response ? {
              status: fetchError.response.status,
              data: fetchError.response.data
            } : 'No response data'
          });
          
          // Instead of falling back to default tasks, show an error
          setError(fetchError.message || "Failed to generate AI writing prompt. Please try again later.");
          setLoading(false);
          setPromptLoading(false);
          isGeneratingPrompt.current = false;
          return; // Exit early
        }
        
        if (assessmentData && assessmentData.tasks && assessmentData.tasks.length > 0) {
          console.log("Got valid assessment data from service:", { 
            taskCount: assessmentData.tasks.length,
            title: assessmentData.tasks[0].title,
            promptStart: assessmentData.tasks[0].prompt.substring(0, 50) + "..."
          });
          setTasks(assessmentData.tasks);
          // Initialize responses array
          setResponses(new Array(assessmentData.tasks.length).fill(''));
          // Initialize AI evaluation results array
          setAiEvaluationResults(new Array(assessmentData.tasks.length).fill(null));
          setLoading(false);
          setPromptLoading(false);
        } else {
          // If no valid data, show error instead of falling back
          console.log("No valid assessment data or empty tasks");
          setError("Failed to generate AI writing prompt. Please try again later.");
          setLoading(false);
          setPromptLoading(false);
        }
        
        // Mark that we're done generating a prompt
        isGeneratingPrompt.current = false;
      } catch (error) {
        console.error("Error loading tasks:", error);
        setError(error.message || "Failed to load assessment tasks. Please try again later.");
        setLoading(false);
        setPromptLoading(false);
        isGeneratingPrompt.current = false;
      }
    };

    loadTasks();
    // Reset timer
    setTimeLeft(null);
  }, [level, language]);

  useEffect(() => {
    if (timeLeft === 0) {
      handleNextTask();
    }
    if (timeLeft > 0 && timerActive) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft, timerActive]);

  // Initialize with default tasks if needed
  useEffect(() => {
    if (!loading && (!tasks || tasks.length === 0)) {
      console.log("No tasks available, initializing with default tasks");
      const defaultTasks = getTasksByLevelAndLanguage(level || 'b1', language || 'english');
      setTasks(defaultTasks);
      setResponses(new Array(defaultTasks.length).fill(''));
      setAiEvaluationResults(new Array(defaultTasks.length).fill(null));
    }
  }, [loading, tasks, level, language]);

  const getTasksByLevelAndLanguage = (level, language) => {
    // In a real app, these would come from a database
    console.log(`Getting fallback writing tasks for level: ${level}, language: ${language}`);
    
    const tasksByLevel = {
      'a1': [
        {
          id: 1,
          title: language === 'english' ? 'A Day at the Market' : 'Une Journée au Marché',
          prompt: language === 'english' ? 
            'Imagine you are at a local market. Write about what you can see, what you want to buy, and who is with you. Use simple present tense and basic descriptive words.' : 
            'Imaginez que vous êtes dans un marché local. Écrivez ce que vous pouvez voir, ce que vous voulez acheter et qui est avec vous. Utilisez le présent simple et des mots descriptifs de base.',
          timeLimit: 10 * 60, // 10 minutes
          wordLimit: 50,
          criteria: [
            language === 'english' ? 'Basic Vocabulary' : 'Vocabulaire de Base', 
            language === 'english' ? 'Simple Sentences' : 'Phrases Simples', 
            language === 'english' ? 'Present Tense Usage' : 'Utilisation du Présent'
          ]
        }
      ],
      'b1': [
        {
          id: 1,
          title: language === 'english' ? 'A Local Festival Experience' : 'Une Expérience de Festival Local',
          prompt: language === 'english' ? 
            'Describe a local festival or cultural event you attended recently. Explain what happened, who you went with, what you enjoyed most, and why this experience was memorable. Include details about food, activities, and atmosphere.' : 
            'Décrivez un festival local ou un événement culturel auquel vous avez assisté récemment. Expliquez ce qui s\'est passé, avec qui vous y êtes allé, ce que vous avez le plus apprécié et pourquoi cette expérience était mémorable. Incluez des détails sur la nourriture, les activités et l\'atmosphère.',
          timeLimit: 20 * 60, // 20 minutes
          wordLimit: 150,
          criteria: [
            language === 'english' ? 'Past Tense Narration' : 'Narration au Passé', 
            language === 'english' ? 'Descriptive Language' : 'Langage Descriptif', 
            language === 'english' ? 'Logical Sequence' : 'Séquence Logique',
            language === 'english' ? 'Cultural Vocabulary' : 'Vocabulaire Culturel'
          ]
        }
      ],
      'c1': [
        {
          id: 1,
          title: language === 'english' ? 'Digital Privacy in Modern Society' : 'La Confidentialité Numérique dans la Société Moderne',
          prompt: language === 'english' ? 
            'In an increasingly digital world, privacy concerns have become a major issue. Write an essay discussing the balance between technological advancement and personal privacy. Consider both the benefits of data collection for services and the potential risks to individual rights. Present different perspectives and conclude with your own reasoned opinion.' : 
            'Dans un monde de plus en plus numérique, les préoccupations relatives à la vie privée sont devenues un problème majeur. Rédigez un essai discutant de l\'équilibre entre le progrès technologique et la vie privée. Considérez à la fois les avantages de la collecte de données pour les services et les risques potentiels pour les droits individuels. Présentez différentes perspectives et concluez avec votre propre opinion raisonnée.',
          timeLimit: 40 * 60, // 40 minutes
          wordLimit: 300,
          criteria: [
            language === 'english' ? 'Advanced Vocabulary' : 'Vocabulaire Avancé', 
            language === 'english' ? 'Complex Sentence Structures' : 'Structures de Phrases Complexes', 
            language === 'english' ? 'Cohesive Arguments' : 'Arguments Cohésifs',
            language === 'english' ? 'Critical Analysis' : 'Analyse Critique',
            language === 'english' ? 'Academic Register' : 'Registre Académique'
          ]
        }
      ]
    };
    
    // Add A2 level tasks
    tasksByLevel['a2'] = [
      {
        id: 1,
        title: language === 'english' ? 'My Favorite Restaurant' : 'Mon Restaurant Préféré',
        prompt: language === 'english' ? 
          'Write about your favorite restaurant. Describe the location, the type of food they serve, what you usually order, and why you like it. Include a brief description of your last visit there.' : 
          'Écrivez à propos de votre restaurant préféré. Décrivez l\'emplacement, le type de nourriture qu\'ils servent, ce que vous commandez habituellement et pourquoi vous l\'aimez. Incluez une brève description de votre dernière visite.',
        timeLimit: 15 * 60, // 15 minutes
        wordLimit: 80,
        criteria: [
          language === 'english' ? 'Food Vocabulary' : 'Vocabulaire de la Nourriture', 
          language === 'english' ? 'Simple Connectors' : 'Connecteurs Simples', 
          language === 'english' ? 'Opinion Expression' : 'Expression d\'Opinion',
          language === 'english' ? 'Past and Present Tense' : 'Passé et Présent'
        ]
      }
    ];
    
    // Add B2 level tasks
    tasksByLevel['b2'] = [
      {
        id: 1,
        title: language === 'english' ? 'The Impact of Social Media on Communication' : 'L\'Impact des Médias Sociaux sur la Communication',
        prompt: language === 'english' ? 
          'Write an essay discussing how social media has changed the way people communicate. Consider both positive and negative effects on personal relationships, professional interactions, and society as a whole. Include specific examples to support your points and conclude with your view on whether these changes are beneficial overall.' : 
          'Rédigez un essai discutant de la façon dont les médias sociaux ont changé la façon dont les gens communiquent. Considérez les effets positifs et négatifs sur les relations personnelles, les interactions professionnelles et la société dans son ensemble. Incluez des exemples spécifiques pour soutenir vos points et concluez avec votre point de vue sur la question de savoir si ces changements sont globalement bénéfiques.',
        timeLimit: 30 * 60, // 30 minutes
        wordLimit: 200,
        criteria: [
          language === 'english' ? 'Balanced Argument' : 'Argument Équilibré', 
          language === 'english' ? 'Appropriate Register' : 'Registre Approprié', 
          language === 'english' ? 'Complex Structures' : 'Structures Complexes',
          language === 'english' ? 'Technology Vocabulary' : 'Vocabulaire Technologique',
          language === 'english' ? 'Cohesive Devices' : 'Dispositifs de Cohésion'
        ]
      }
    ];
    
    // Add C2 level tasks
    tasksByLevel['c2'] = [
      {
        id: 1,
        title: language === 'english' ? 'Ethical Implications of Artificial Intelligence' : 'Implications Éthiques de l\'Intelligence Artificielle',
        prompt: language === 'english' ? 
          'Write a sophisticated essay analyzing the ethical implications of artificial intelligence in modern society. Examine philosophical questions related to consciousness, autonomy, and responsibility. Consider various stakeholders including developers, users, regulators, and those affected by AI systems. Evaluate existing ethical frameworks and propose principles that should guide AI development and deployment.' : 
          'Rédigez un essai sophistiqué analysant les implications éthiques de l\'intelligence artificielle dans la société moderne. Examinez les questions philosophiques liées à la conscience, l\'autonomie et la responsabilité. Considérez les diverses parties prenantes, y compris les développeurs, les utilisateurs, les régulateurs et ceux qui sont affectés par les systèmes d\'IA. Évaluez les cadres éthiques existants et proposez des principes qui devraient guider le développement et le déploiement de l\'IA.',
        timeLimit: 50 * 60, // 50 minutes
        wordLimit: 400,
        criteria: [
          language === 'english' ? 'Sophisticated Vocabulary' : 'Vocabulaire Sophistiqué', 
          language === 'english' ? 'Complex Argumentation' : 'Argumentation Complexe', 
          language === 'english' ? 'Critical Evaluation' : 'Évaluation Critique',
          language === 'english' ? 'Nuanced Perspective' : 'Perspective Nuancée',
          language === 'english' ? 'Academic Precision' : 'Précision Académique'
        ]
      }
    ];
    
    // Default to 'b1' if level is not specified
    const normalizedLevel = (level || 'b1').toLowerCase();
    
    // If level not found, default to B1 (or the first available level)
    const levelTasks = tasksByLevel[normalizedLevel] || tasksByLevel['b1'] || Object.values(tasksByLevel)[0];
    
    // Create a deep copy to avoid state mutation issues
    const result = JSON.parse(JSON.stringify(levelTasks));
    console.log(`Returning ${result.length} fallback tasks for level: ${normalizedLevel}`);
    return result;
  };

  const handleResponseChange = (value) => {
    const newResponses = [...responses];
    newResponses[currentTask] = value;
    setResponses(newResponses);
  };

  const handleNextTask = () => {
    // With a single task, next is always submit
      handleSubmit();
  };

  const handlePreviousTask = () => {
    if (currentTask > 0) {
      setCurrentTask(currentTask - 1);
      setTimeLeft(null);
      setTimerActive(false);
    }
  };

  const startTimer = () => {
    if (!timerActive) {
      setTimeLeft(tasks[currentTask].timeLimit);
      setTimerActive(true);
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      
      // Get the single task and response
      const task = tasks[0];
      const response = responses[0];
      
      if (!response || response.trim() === '') {
        throw new Error('No response provided');
      }
        
      // Evaluate the writing using our AI service
      let evaluationResult;
      try {
        console.log('Evaluating writing response using AI service...');
        evaluationResult = await WritingAssessmentService.evaluateWriting(
          task.prompt,
          response
        );
        
        if (!evaluationResult) {
          throw new Error('No evaluation result received from the AI service');
        }
        
        console.log('AI evaluation successful:', {
          score: evaluationResult.overallScore,
          criteriaCount: evaluationResult.criteria?.length
        });
        
        setAiEvaluationResults([evaluationResult]);
      } catch (evalError) {
        console.error('Error evaluating writing with AI:', evalError);
        // Don't use local evaluation unless absolutely necessary
        if (evalError.message.includes('network') || 
            evalError.message.includes('timeout') || 
            evalError.message.includes('unavailable')) {
          console.warn('Network issue detected, using fallback evaluation');
          // Will use fallback evaluation only for network issues
        } else {
          // For other issues, rethrow to avoid using fallback
          throw evalError;
        }
      }
      
      // Use AI evaluation if available, otherwise fall back
      const useAiEvaluation = !!evaluationResult;
      console.log('Using AI evaluation:', useAiEvaluation);
      
      // Prepare task with response and evaluation metrics
      const taskWithResponse = {
        ...task,
        response: response,
        wordCount: response.split(/\s+/).filter(Boolean).length,
        aiEvaluation: evaluationResult,
        metrics: evaluationResult ? evaluationResult.criteria : evaluateResponse(response, task)
      };
      
      // Calculate the consistent score based on criteria
      const criteria = evaluationResult ? evaluationResult.criteria : taskWithResponse.metrics;
      // Each criterion is out of 10, so total is out of 50, convert to percentage
      const totalPoints = criteria.reduce((sum, criterion) => sum + criterion.score, 0);
      const calculatedScore = Math.round((totalPoints / 50) * 100);
      
      // Log any discrepancy
      if (evaluationResult && evaluationResult.overallScore !== calculatedScore) {
        console.log(`Score discrepancy detected: AI gave ${evaluationResult.overallScore}%, calculation gives ${calculatedScore}%`);
      }
      
      // Always use the calculated score for consistency
      const overallScore = calculatedScore;
      console.log(`Using calculated score for consistency: ${overallScore}%`);
      
      // Generate feedback - use AI feedback if available
      const overallFeedback = evaluationResult ? 
        evaluationResult.overallFeedback : 
        CEFRService.generateFeedback(overallScore, level, 'writing');
      
      // Get recommendations from AI or default
      const recommendations = evaluationResult?.recommendations || 
        CEFRService.getRecommendations(overallScore, level, 'writing');
      
      // Prepare the final results
      const results = {
        type: 'writing',
        level: level,
        language: language,
        score: overallScore,
        tasks: [taskWithResponse],
        cefr: CEFRService.calculateCEFRResult(overallScore, level),
        feedback: overallFeedback,
        recommendations: recommendations,
        isAiEvaluation: useAiEvaluation
      };
      
      // Save results to database
      try {
        console.log('Saving writing assessment results to database...');
        // Import the assessment service dynamically to avoid circular dependencies
        const assessmentServiceModule = await import('../../services/assessment.service');
        const AssessmentService = assessmentServiceModule.default;
        
        // Submit the assessment to the server
        const submissionResponse = await AssessmentService.submitAssessment({
          type: 'writing',
          level,
          language,
          score: overallScore,
          tasks: [taskWithResponse],
          feedback: overallFeedback,
          recommendations: recommendations
        });
        
        console.log('Writing assessment saved successfully:', submissionResponse);
        
        // Add server response data to results if available
        if (submissionResponse && submissionResponse.result) {
          results.submissionId = submissionResponse.result._id;
          results.submissionStatus = submissionResponse.result.status || 'completed';
          results.serverScore = submissionResponse.result.calculatedScore || submissionResponse.result.score;
          
          // Log any discrepancy between client and server calculated scores
          if (results.serverScore !== overallScore) {
            console.log(`Score discrepancy between client (${overallScore}%) and server (${results.serverScore}%)`);
          }
        }
      } catch (dbError) {
        console.error('Error saving writing assessment to database:', dbError);
        // Continue even if database save fails - the user still gets their results
      }
      
      // Pass results to the parent component
      onComplete(results);
    } catch (error) {
      console.error('Error in writing assessment:', error);
      
      // Show error message to user
      alert('There was a problem evaluating your writing. Please try again.');
      
      // Fallback processing if an error occurs
      const task = tasks[0];
      const response = responses[0] || '';
      const score = calculateScore();
      
      const results = {
        type: 'writing',
        level: level,
        language: language,
        score: score,
        tasks: [{
          ...task,
          response: response,
          wordCount: response.split(/\s+/).filter(Boolean).length,
          metrics: evaluateResponse(response, task)
        }],
        cefr: CEFRService.calculateCEFRResult(score, level),
        feedback: CEFRService.generateFeedback(score, level, 'writing'),
        recommendations: CEFRService.getRecommendations(score, level, 'writing'),
        isAiEvaluation: false,
        isErrorFallback: true
      };
      
      // Try to save the fallback results to database
      try {
        console.log('Saving fallback writing assessment results to database...');
        const assessmentServiceModule = await import('../../services/assessment.service');
        const AssessmentService = assessmentServiceModule.default;
        
        const submissionResponse = await AssessmentService.submitAssessment({
          type: 'writing',
          level,
          language,
          score: score,
          tasks: results.tasks,
          feedback: results.feedback,
          recommendations: results.recommendations
        });
        
        console.log('Fallback writing assessment saved successfully:', submissionResponse);
        
        if (submissionResponse && submissionResponse.result) {
          results.submissionId = submissionResponse.result._id;
          results.submissionStatus = submissionResponse.result.status || 'completed';
        }
      } catch (dbError) {
        console.error('Error saving fallback writing assessment to database:', dbError);
        // Continue even if database save fails
      }
      
      onComplete(results);
    } finally {
      setSubmitting(false);
    }
  };

  const evaluateResponse = (response, task) => {
    // This is a simple simulation - in a real app, this would be done by AI or human evaluators
    if (!response) return [];
    
    const wordCount = response.split(/\s+/).filter(Boolean).length;
    const sentenceCount = response.split(/[.!?]+/).filter(Boolean).length;
    const avgWordsPerSentence = sentenceCount > 0 ? wordCount / sentenceCount : 0;
    const percentOfWordLimit = (wordCount / task.wordLimit) * 100;
    
    // Check for minimal responses
    const isVeryMinimal = wordCount < 3 || percentOfWordLimit < 5;
    const isMinimal = wordCount < 10 || percentOfWordLimit < 20;
    
    // Generate appropriate feedback based on the response length
    let feedback = '';
    
    if (isVeryMinimal) {
      feedback = language === 'english' 
        ? 'The response is far too brief and does not meet the minimum requirements for assessment.' 
        : 'La réponse est beaucoup trop brève et ne répond pas aux exigences minimales d\'évaluation.';
    } else if (isMinimal) {
      feedback = language === 'english'
        ? 'The response is too brief to demonstrate writing proficiency.' 
        : 'La réponse est trop brève pour démontrer une compétence en écriture.';
    }
    
    // Basic metrics - now out of 10 each
    const metrics = [
      {
        name: language === 'english' ? 'Coherence and Clarity' : 'Cohérence et Clarté',
        score: isVeryMinimal ? 0.5 : isMinimal ? 1 : Math.min(10, 2 + (sentenceCount > 2 ? 3 : 0)),
        comment: isVeryMinimal 
          ? (language === 'english' ? 'Response too brief to evaluate coherence' : 'Réponse trop brève pour évaluer la cohérence')
          : isMinimal
            ? (language === 'english' ? 'Insufficient content to demonstrate coherence' : 'Contenu insuffisant pour démontrer la cohérence')
            : sentenceCount > 2 
              ? (language === 'english' ? 'Basic coherence shown' : 'Cohérence de base montrée') 
              : (language === 'english' ? 'Improve coherence' : 'Améliorez la cohérence')
      },
      {
        name: language === 'english' ? 'Organization and Structure' : 'Organisation et Structure',
        score: isVeryMinimal ? 0.5 : isMinimal ? 1 : Math.min(10, 2 + (percentOfWordLimit > 30 ? 3 : 0)),
        comment: isVeryMinimal 
          ? (language === 'english' ? 'Response too brief to evaluate organization' : 'Réponse trop brève pour évaluer l\'organisation')
          : isMinimal
            ? (language === 'english' ? 'Insufficient content to demonstrate organization' : 'Contenu insuffisant pour démontrer l\'organisation')
            : percentOfWordLimit > 30
              ? (language === 'english' ? 'Basic structure present' : 'Structure de base présente') 
              : (language === 'english' ? 'Improve structure' : 'Améliorez la structure')
      },
      {
        name: language === 'english' ? 'Focus and Content Development' : 'Concentration et Développement du Contenu',
        score: isVeryMinimal ? 0.5 : isMinimal ? 1 : Math.min(10, 2 + (percentOfWordLimit > 50 ? 3 : 0)),
        comment: isVeryMinimal 
          ? (language === 'english' ? 'Response too brief to evaluate content' : 'Réponse trop brève pour évaluer le contenu')
          : isMinimal
            ? (language === 'english' ? 'Insufficient content development' : 'Développement de contenu insuffisant')
            : percentOfWordLimit > 50
              ? (language === 'english' ? 'Some content development shown' : 'Un certain développement du contenu montré') 
              : (language === 'english' ? 'Add more content' : 'Ajoutez plus de contenu')
      },
      {
        name: language === 'english' ? 'Vocabulary and Word Choice' : 'Vocabulaire et Choix de Mots',
        score: isVeryMinimal ? 0.5 : isMinimal ? 1 : Math.min(10, 2 + (avgWordsPerSentence > 5 ? 3 : 0)),
        comment: isVeryMinimal 
          ? (language === 'english' ? 'Response too brief to evaluate vocabulary' : 'Réponse trop brève pour évaluer le vocabulaire')
          : isMinimal
            ? (language === 'english' ? 'Insufficient vocabulary demonstrated' : 'Vocabulaire insuffisant démontré')
            : avgWordsPerSentence > 5
              ? (language === 'english' ? 'Basic vocabulary used' : 'Vocabulaire de base utilisé') 
              : (language === 'english' ? 'Expand vocabulary' : 'Élargissez votre vocabulaire')
      },
      {
        name: language === 'english' ? 'Grammar and Conventions' : 'Grammaire et Conventions',
        score: isVeryMinimal ? 0.5 : isMinimal ? 1 : Math.min(10, 2 + (sentenceCount > 1 ? 3 : 0)),
        comment: isVeryMinimal 
          ? (language === 'english' ? 'Response too brief to evaluate grammar' : 'Réponse trop brève pour évaluer la grammaire')
          : isMinimal
            ? (language === 'english' ? 'Insufficient text to evaluate grammar properly' : 'Texte insuffisant pour évaluer correctement la grammaire')
            : (language === 'english' ? 'Basic grammar usage' : 'Utilisation grammaticale de base')
      }
    ];
    
    return metrics;
  };

  const calculateScore = () => {
    // Get the response for the single task
    const response = responses[0];
    if (!response || response.trim() === '') {
      return 0;
    }
    
    const task = tasks[0];
    const wordCount = response.split(/\s+/).filter(Boolean).length;
    const sentenceCount = response.split(/[.!?]+/).filter(Boolean).length;
    const avgWordsPerSentence = sentenceCount > 0 ? wordCount / sentenceCount : 0;
    
    // Apply severe penalties for minimal responses
    const percentOfWordLimit = (wordCount / task.wordLimit) * 100;
    const isVeryMinimal = wordCount < 3 || percentOfWordLimit < 5;
    const isMinimal = wordCount < 10 || percentOfWordLimit < 20;
    
    // For extremely minimal responses like "asdsadsad", return a very low score
    if (isVeryMinimal) {
      return 5; // 5% score for nearly empty responses
    }
    
    // For minimal but not extremely minimal responses
    if (isMinimal) {
      return Math.min(20, percentOfWordLimit); // Maximum 20% for minimal responses
    }
    
    // Use evaluateResponse to get the metrics, then calculate score consistently
    const metrics = evaluateResponse(response, task);
    const totalPoints = metrics.reduce((sum, criterion) => sum + criterion.score, 0);
    const percentageScore = Math.round((totalPoints / 50) * 100); // Each criterion is out of 10, total out of 50
    
    return percentageScore;
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Function to view a previous assessment
  const viewPreviousAssessment = (assessment) => {
    setSelectedAssessment(assessment);
    setShowPreviousResults(true);
  };

  // Function to format date
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const options = { year: 'numeric', month: 'short', day: 'numeric' };
      return date.toLocaleDateString(undefined, options);
    } catch (error) {
      return dateString;
    }
  };

  // Add these functions to handle the view toggle
  const showNewAssessment = () => {
    setShowPreviousResults(false);
    setSelectedAssessment(null);
  };

  // Helper function to format cooldown time
  const formatCooldownTime = (date) => {
    const now = new Date();
    const remainingTime = date - now;
    
    if (remainingTime <= 0) return language === 'english' ? 'Available now' : 'Disponible maintenant';
    
    const days = Math.floor(remainingTime / (1000 * 60 * 60 * 24));
    const hours = Math.floor((remainingTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) {
      return language === 'english' 
        ? `${days} day${days !== 1 ? 's' : ''} and ${hours} hour${hours !== 1 ? 's' : ''}` 
        : `${days} jour${days !== 1 ? 's' : ''} et ${hours} heure${hours !== 1 ? 's' : ''}`;
    }
    
    return language === 'english'
      ? `${hours} hour${hours !== 1 ? 's' : ''} and ${minutes} minute${minutes !== 1 ? 's' : ''}`
      : `${hours} heure${hours !== 1 ? 's' : ''} et ${minutes} minute${minutes !== 1 ? 's' : ''}`;
  };

  return (
    <div className="writing-assessment-container">
      <h2>{language === 'english' ? 'Writing Assessment' : 'Évaluation d\'Écriture'} - {level.toUpperCase()}</h2>
      
      {loading ? (
        <div className="max-w-3xl mx-auto p-8 bg-white rounded-lg shadow-lg text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#592538] mb-4"></div>
          <h2 className="text-xl font-semibold text-[#592538] mb-2">
            {language === 'english' ? 'Loading Assessment' : 'Chargement de l\'Évaluation'}
          </h2>
          <p className="text-gray-600">
            {language === 'english' ? 'Preparing your writing assessment...' : 'Préparation de votre évaluation d\'écriture...'}
          </p>
        </div>
      ) : error ? (
        <div className="max-w-3xl mx-auto p-8 bg-white rounded-lg shadow-lg text-center">
          <div className="text-red-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            {language === 'english' ? 'Unable to Generate Writing Prompt' : 'Impossible de Générer le Sujet d\'Écriture'}
          </h2>
          <p className="text-gray-600 mb-6">
            {error}
          </p>
          <div className="flex justify-center space-x-4">
            <button 
              onClick={onBack}
              className="px-4 py-2 text-[#592538] border border-[#592538] rounded-lg hover:bg-[#592538]/10"
            >
              {language === 'english' ? 'Back' : 'Retour'}
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-[#592538] text-white rounded-lg hover:bg-[#6d2c44]"
            >
              {language === 'english' ? 'Try Again' : 'Réessayer'}
            </button>
          </div>
        </div>
      ) : !canTakeAssessment && nextAvailableDate ? (
        <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-lg">
          <div className="mb-8">
            <div className="text-center">
              <div className="relative inline-block mb-4">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full border-2 border-blue-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {language === 'english' ? 'Writing Assessment' : 'Évaluation d\'Écriture'} - {level.toUpperCase()}
              </h2>
              <h3 className="text-xl font-semibold text-blue-700 mb-2">
                {language === 'english' ? 'Assessment Cooldown Period' : 'Période de Récupération d\'Évaluation'}
              </h3>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100 shadow-sm mt-6">
              <p className="text-center text-gray-700 mb-4">
                {language === 'english' 
                  ? `You've recently completed this assessment. You can take it again after ${formatDate(nextAvailableDate)}.` 
                  : `Vous avez récemment terminé cette évaluation. Vous pouvez la reprendre après le ${formatDate(nextAvailableDate)}.`}
              </p>
              
              <div className="flex justify-center items-center space-x-4 bg-white p-4 rounded-lg shadow-sm mb-4">
                <div className="text-center">
                  <p className="text-sm text-gray-500">{language === 'english' ? 'Time remaining:' : 'Temps restant:'}</p>
                  <p className="text-2xl font-bold text-blue-600">{formatCooldownTime(nextAvailableDate)}</p>
                </div>
              </div>
            </div>
          </div>
          
          {selectedAssessment && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-indigo-600 px-6 py-4">
                <h3 className="text-xl font-bold text-white">
                  {language === 'english' ? 'Your Last Assessment Result' : 'Résultat de Votre Dernière Évaluation'}
                </h3>
              </div>
              
              <div className="p-6">
                <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
                  <div>
                    <p className="text-sm text-gray-500">{language === 'english' ? 'Completed on:' : 'Terminé le:'}</p>
                    <p className="text-lg font-medium">{formatDate(selectedAssessment.completedAt)}</p>
                  </div>
                  <div className="bg-gray-100 rounded-full h-20 w-20 flex items-center justify-center border-4 border-white shadow">
                    <span className="text-2xl font-bold text-indigo-700">{selectedAssessment.score}%</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-800 mb-2">{language === 'english' ? 'Prompt:' : 'Consigne:'}</h4>
                    <p className="text-gray-700">{selectedAssessment.prompt}</p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-800 mb-2">{language === 'english' ? 'Your Response:' : 'Votre Réponse:'}</h4>
                    <div className="bg-white p-3 rounded border border-gray-200 max-h-60 overflow-y-auto">
                      <p className="text-gray-700 whitespace-pre-line">{selectedAssessment.response}</p>
                    </div>
                  </div>
                </div>
                
                {selectedAssessment.criteria && selectedAssessment.criteria.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-medium text-gray-800 mb-3">{language === 'english' ? 'Detailed Criteria:' : 'Critères Détaillés:'}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedAssessment.criteria.map((criterion, index) => {
                        // Calculate color based on score
                        const scorePercent = (criterion.score / 10) * 100;
                        const colorClass = 
                          scorePercent >= 80 ? 'bg-green-50 border-green-200' : 
                          scorePercent >= 60 ? 'bg-blue-50 border-blue-200' : 
                          scorePercent >= 40 ? 'bg-yellow-50 border-yellow-200' : 
                          'bg-red-50 border-red-200';
                          
                        const textColorClass = 
                          scorePercent >= 80 ? 'text-green-700' : 
                          scorePercent >= 60 ? 'text-blue-700' : 
                          scorePercent >= 40 ? 'text-yellow-700' : 
                          'text-red-700';
                          
                        return (
                          <div key={index} className={`rounded-lg p-3 border ${colorClass}`}>
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-medium">{criterion.name}</span>
                              <span className={`font-bold ${textColorClass}`}>{criterion.score}/10</span>
                            </div>
                            <p className="text-sm text-gray-600">{criterion.feedback}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div className="mt-8 text-center">
            <button 
              className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors duration-200 shadow-sm"
              onClick={onBack}
            >
              {language === 'english' ? 'Back to Communication Skills' : 'Retour aux Compétences de Communication'}
            </button>
          </div>
        </div>
      ) : (
        <div className="assessment-content">
          <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-lg">
            <div className="mb-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-[#592538]">
                  {language === 'english' ? 'Writing Assessment' : 'Évaluation d\'Écriture'} - {level.toUpperCase()}
                </h2>
                <div className="text-right">
                  <div className="text-gray-600">
                    {language === 'english' ? 'Task' : 'Tâche'} 1/1
                  </div>
                  {timeLeft !== null && (
                    <div className="text-gray-600">
                      {language === 'english' ? 'Time Remaining:' : 'Temps Restant:'} {formatTime(timeLeft)}
                    </div>
                  )}
                </div>
              </div>

              {previousAssessments.length > 0 && (
                <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <h3 className="text-lg font-medium text-blue-800 mb-2">
                    {language === 'english' ? 'Your Previous Assessments' : 'Vos Évaluations Précédentes'}
                  </h3>
                  <div className="flex flex-col space-y-2">
                    {previousAssessments.slice(0, 3).map((assessment, index) => (
                      <div key={index} className="flex justify-between items-center bg-white p-2 rounded border border-blue-100">
                        <div>
                          <span className="text-sm font-medium">{formatDate(assessment.completedAt)}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-[#592538] font-bold mr-3">{assessment.score}%</span>
                          <button 
                            onClick={() => viewPreviousAssessment(assessment)}
                            className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                          >
                            {language === 'english' ? 'View' : 'Voir'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {previousAssessments.length > 3 && (
                    <div className="mt-2 text-right">
                      <button 
                        onClick={() => setShowPreviousResults(true)}
                        className="text-xs text-blue-700 hover:underline"
                      >
                        {language === 'english' ? `View All (${previousAssessments.length})` : `Voir Tout (${previousAssessments.length})`}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {promptLoading ? (
                <div className="bg-gray-50 p-8 rounded-lg mb-6 text-center">
                  <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#592538] mb-4"></div>
                  <h3 className="text-xl font-medium text-[#592538] mb-2">
                    {language === 'english' ? 'Generating your writing prompt...' : 'Génération de votre sujet d\'écriture...'}
                  </h3>
                  <p className="text-gray-600">
                    {language === 'english' ? 'Our AI is creating a personalized writing topic for your level.' : 'Notre IA crée un sujet d\'écriture personnalisé pour votre niveau.'}
                  </p>
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <h3 className="text-xl font-medium text-[#592538] mb-2">
                    {tasks && tasks.length > 0 && tasks[currentTask] ? tasks[currentTask].title : 'Loading...'}
                  </h3>
                  <p className="text-gray-800 mb-4">{tasks && tasks.length > 0 && tasks[currentTask] ? tasks[currentTask].prompt : ''}</p>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>
                      {language === 'english' ? 'Word target:' : 'Objectif de mots:'} ~{tasks && tasks.length > 0 && tasks[currentTask] ? tasks[currentTask].wordLimit : ''}
                    </span>
                    <span>
                      {language === 'english' ? 'Time limit:' : 'Limite de temps:'} {tasks && tasks.length > 0 && tasks[currentTask] ? formatTime(tasks[currentTask].timeLimit) : ''}
                    </span>
                  </div>
                </div>
              )}

              <div className="mb-6">
                <textarea
                  className="w-full h-64 p-4 border rounded-lg focus:ring-2 focus:ring-[#592538] focus:border-transparent"
                  placeholder={language === 'english' ? 'Write your response here...' : 'Écrivez votre réponse ici...'}
                  value={responses && responses.length > 0 ? responses[currentTask] || '' : ''}
                  onChange={(e) => handleResponseChange(e.target.value)}
                  onFocus={startTimer}
                  disabled={promptLoading}
                />
                <div className="mt-2 flex justify-between text-sm">
                  <span className="text-gray-600">
                    {language === 'english' ? 'Word count:' : 'Nombre de mots:'} {responses && responses.length > 0 && responses[currentTask] ? responses[currentTask].split(/\s+/).filter(Boolean).length || 0 : 0}
                  </span>
                  {timeLeft !== null && !timerActive && (
                    <button
                      onClick={() => setTimerActive(true)}
                      className="text-[#592538] hover:underline"
                    >
                      {language === 'english' ? 'Resume timer' : 'Reprendre le minuteur'}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex justify-between">
                <div></div> {/* Empty div to push buttons to the right */}
                
                <div>
                  <button
                    onClick={onBack}
                    className="px-4 py-2 mx-2 text-[#592538] border border-[#592538] rounded-lg hover:bg-[#592538]/10"
                  >
                    {language === 'english' ? 'Exit' : 'Quitter'}
                  </button>
                  
                  <button
                    onClick={handleSubmit}
                    className={`px-6 py-2 ${
                      submitting || promptLoading ? 'bg-gray-400' : 'bg-[#592538] hover:bg-[#6d2c44]'
                    } text-white rounded-lg flex items-center`}
                    disabled={submitting || promptLoading || !responses || responses.length === 0 || !responses[currentTask] || responses[currentTask].trim() === ''}
                  >
                    {submitting && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    )}
                    {language === 'english' ? (submitting ? 'Analyzing...' : 'Submit') : (submitting ? 'Analyse...' : 'Soumettre')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WritingAssessment; 