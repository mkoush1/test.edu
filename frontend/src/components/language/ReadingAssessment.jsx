import React, { useState, useEffect } from 'react';
import CEFRService from '../../services/cefr.service';
import readingAssessmentService from '../../services/readingAssessment.service';

const ReadingAssessment = ({ onComplete, level, language, onBack }) => {
  // State for assessment data and UI
  const [loading, setLoading] = useState(true);
  const [assessmentData, setAssessmentData] = useState(null);
  const [assessmentUnavailable, setAssessmentUnavailable] = useState(false);
  const [assessmentAvailability, setAssessmentAvailability] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  
  // State for answers
  const [multipleChoiceAnswers, setMultipleChoiceAnswers] = useState({});
  const [trueFalseAnswers, setTrueFalseAnswers] = useState({});
  const [fillBlanksAnswers, setFillBlanksAnswers] = useState({});
  const [selectedWords, setSelectedWords] = useState({});
  const [categorizationAnswers, setCategorizationAnswers] = useState({});
  
  // UI state
  const [activeTab, setActiveTab] = useState('reading'); // 'reading', 'tasks'
  const [showFeedback, setShowFeedback] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);

  useEffect(() => {
    // Check if the user can take this assessment
    const checkAvailability = async () => {
      try {
        setLoading(true);
        const availabilityData = await readingAssessmentService.checkAssessmentAvailability(level, language);
        setAssessmentAvailability(availabilityData);
        
        // If assessment is not available, show a message and set state to indicate unavailability
        if (availabilityData && !availabilityData.available) {
          setAssessmentUnavailable(true);
          setLoading(false);
          return;
        }
        
        // Continue loading assessment data if assessment is available
        loadAssessmentData();
      } catch (error) {
        console.error("Error checking assessment availability:", error);
        // Only load assessment data if the error is related to the availability check itself
        // Don't bypass the cooldown check due to an error
        loadAssessmentData();
      }
    };

    // Load assessment data based on language and level
    const loadAssessmentData = async () => {
      try {
        setLoading(true);
        const response = await readingAssessmentService.getAssessmentData(level, language);
        
        console.log("Reading assessment API response:", response);
        
        // Check if the data is nested in a data property (from API format)
        const assessmentContent = response.data ? response.data : response;
        
        console.log("Actual assessment content to use:", assessmentContent);
        setAssessmentData(assessmentContent);
        
        // Initialize answer states based on assessment data
        if (assessmentContent.multipleChoiceQuestions) {
          const initialMCAnswers = {};
          assessmentContent.multipleChoiceQuestions.forEach((q, index) => {
            initialMCAnswers[index] = null;
          });
          setMultipleChoiceAnswers(initialMCAnswers);
        }
        
        if (assessmentContent.trueFalseQuestions) {
          const initialTFAnswers = {};
          assessmentContent.trueFalseQuestions.forEach((q, index) => {
            initialTFAnswers[index] = null;
          });
          setTrueFalseAnswers(initialTFAnswers);
        }
        
        if (assessmentContent.fillInBlanks) {
          const initialFillAnswers = {};
          assessmentContent.fillInBlanks.sentences.forEach((sentence) => {
            initialFillAnswers[sentence.id] = "";
          });
          setFillBlanksAnswers(initialFillAnswers);
        } else if (assessmentContent.fillBlanksQuestions) {
          // Handle different property name from API
          const initialFillAnswers = {};
          assessmentContent.fillBlanksQuestions.sentences.forEach((sentence) => {
            initialFillAnswers[sentence.id] = "";
          });
          setFillBlanksAnswers(initialFillAnswers);
        }
        
        // Initialize categorization answers if present
        if (assessmentContent.categorization) {
          const initialCategoryAnswers = {};
          assessmentContent.categorization.items.forEach(item => {
            initialCategoryAnswers[item.id] = null; // null means not categorized yet
          });
          setCategorizationAnswers(initialCategoryAnswers);
        } else if (assessmentContent.categorizationQuestions) {
          // Handle different property name from API
          const initialCategoryAnswers = {};
          assessmentContent.categorizationQuestions.items.forEach(item => {
            initialCategoryAnswers[item.id] = null; // null means not categorized yet
          });
          setCategorizationAnswers(initialCategoryAnswers);
        }
        
        // Set timer based on level
        setTimeLeft(assessmentContent.timeLimit || getTimeLimitByLevel(level));
        
        setLoading(false);
      } catch (error) {
        console.error("Error loading reading assessment data:", error);
        setLoading(false);
      }
    };

    // Start by checking availability
    checkAvailability();
  }, [level, language]);

  // Timer effect
  useEffect(() => {
    if (timeLeft === 0) {
      handleSubmit();
    }
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  // Get time limit based on CEFR level
  const getTimeLimitByLevel = (level) => {
    const timeLimits = {
      'a1': 10 * 60, // 10 minutes in seconds
      'a2': 15 * 60, // 15 minutes
      'b1': 20 * 60, // 20 minutes
      'b2': 30 * 60, // 30 minutes
      'c1': 40 * 60, // 40 minutes
      'c2': 50 * 60  // 50 minutes
    };
    return timeLimits[level.toLowerCase()] || 20 * 60; // Default 20 minutes
  };

  // Format time for display (minutes:seconds)
  const formatTime = (seconds) => {
    if (!seconds && seconds !== 0) return "--:--";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Handle multiple choice answer changes
  const handleMultipleChoiceAnswer = (questionIndex, optionIndex) => {
    setMultipleChoiceAnswers({
      ...multipleChoiceAnswers,
      [questionIndex]: optionIndex
    });
  };

  // Handle true/false answer changes
  const handleTrueFalseAnswer = (questionIndex, value) => {
    setTrueFalseAnswers({
      ...trueFalseAnswers,
      [questionIndex]: value
    });
  };

  // Handle fill-in-the-blanks answer changes
  const handleFillBlanksAnswer = (sentenceId, word) => {
    setFillBlanksAnswers({
      ...fillBlanksAnswers,
      [sentenceId]: word
    });
    
    // Mark word as selected
    setSelectedWords({
      ...selectedWords,
      [word]: sentenceId
    });
  };

  // Remove a word from a fill-in-the-blanks sentence
  const clearFillBlankAnswer = (sentenceId) => {
    const word = fillBlanksAnswers[sentenceId];
    
    // Clear from answers
    const newAnswers = { ...fillBlanksAnswers };
    newAnswers[sentenceId] = "";
    setFillBlanksAnswers(newAnswers);
    
    // Clear from selected words
    const newSelectedWords = { ...selectedWords };
    delete newSelectedWords[word];
    setSelectedWords(newSelectedWords);
  };

  // Check if all questions have been answered
  const allQuestionsAnswered = () => {
    // Check multiple choice questions
    const mcAnswered = assessmentData?.multipleChoiceQuestions ?
      Object.values(multipleChoiceAnswers).every(a => a !== null) : true;
    
    // Check true/false questions
    const tfAnswered = assessmentData?.trueFalseQuestions ?
      Object.values(trueFalseAnswers).every(a => a !== null) : true;
    
    // Check fill-in-the-blanks questions
    const fbAnswered = assessmentData?.fillInBlanks ?
      Object.values(fillBlanksAnswers).every(a => a !== "") : true;
    
    // Check categorization questions
    const catAnswered = assessmentData?.categorization ?
      Object.values(categorizationAnswers).every(a => a !== null) : true;
    
    return mcAnswered && tfAnswered && fbAnswered && catAnswered;
  };

  // Handle categorization drag start
  const handleDragStart = (e, itemId) => {
    setDraggedItem(itemId);
  };

  // Handle categorization drop into a category
  const handleDrop = (e, categoryId) => {
    e.preventDefault();
    if (draggedItem !== null) {
      setCategorizationAnswers({
        ...categorizationAnswers,
        [draggedItem]: categoryId
      });
      setDraggedItem(null);
    }
  };

  // Handle drag over (needed for drag and drop to work)
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // Reset a categorization item (remove from category)
  const resetCategorizationItem = (itemId) => {
    setCategorizationAnswers({
      ...categorizationAnswers,
      [itemId]: null
    });
  };

  // Get items assigned to a specific category
  const getItemsInCategory = (categoryId) => {
    return Object.entries(categorizationAnswers)
      .filter(([_, category]) => category === categoryId)
      .map(([itemId]) => parseInt(itemId));
  };

  // Calculate score based on all answers
  const calculateScore = () => {
    let totalCorrect = 0;
    let totalQuestions = 0;
    
    // Score multiple choice questions
    if (assessmentData?.multipleChoiceQuestions) {
      assessmentData.multipleChoiceQuestions.forEach((q, index) => {
        if (multipleChoiceAnswers[index] === q.correctAnswer) {
          totalCorrect++;
        }
        totalQuestions++;
      });
    }
    
    // Score true/false questions
    if (assessmentData?.trueFalseQuestions) {
      assessmentData.trueFalseQuestions.forEach((q, index) => {
        if (trueFalseAnswers[index] === q.isTrue) {
          totalCorrect++;
        }
        totalQuestions++;
      });
    }
    
    // Score fill-in-the-blanks questions
    if (assessmentData?.fillInBlanks) {
      assessmentData.fillInBlanks.sentences.forEach((sentence) => {
        if (fillBlanksAnswers[sentence.id]?.toLowerCase() === sentence.answer.toLowerCase()) {
          totalCorrect++;
        }
        totalQuestions++;
      });
    }
    
    // Score categorization questions
    if (assessmentData?.categorization) {
      assessmentData.categorization.items.forEach((item) => {
        // Find which category this item should belong to
        const correctCategory = assessmentData.categorization.categories.find(
          category => category.correctItems.includes(item.id)
        );
        
        if (correctCategory && categorizationAnswers[item.id] === correctCategory.id) {
          totalCorrect++;
        }
        totalQuestions++;
      });
    }
    
    // Calculate percentage
    const percentage = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
    
    return {
      correct: totalCorrect,
      total: totalQuestions,
      percentage: percentage
    };
  };

  // Submit assessment
  const handleSubmit = async () => {
    try {
      const score = calculateScore();
      
      // Prepare results for submission and display
      const results = {
        type: 'reading',
        level: level,
        language: language,
        title: assessmentData?.title || `Reading Assessment - ${level.toUpperCase()}`,
        score: score.percentage,
        correctAnswers: score.correct,
        totalQuestions: score.total,
        timeSpent: (assessmentData?.timeLimit || getTimeLimitByLevel(level)) - timeLeft,
        cefr: CEFRService.calculateCEFRResult(score.percentage, level),
        multipleChoiceAnswers: multipleChoiceAnswers,
        trueFalseAnswers: trueFalseAnswers,
        fillBlanksAnswers: fillBlanksAnswers,
        categorizationAnswers: categorizationAnswers,
        feedback: CEFRService.generateFeedback(score.percentage, level, 'reading')
      };
      
      // Submit to backend
      try {
        const response = await readingAssessmentService.submitAssessment({
          level,
          language,
          score: score.percentage,
          multipleChoiceAnswers,
          trueFalseAnswers,
          fillBlanksAnswers,
          categorizationAnswers,
          timeSpent: (assessmentData?.timeLimit || getTimeLimitByLevel(level)) - timeLeft
        });
        
        console.log('Backend submission response:', response);
        
        // If submission was successful, add assessment ID to results
        if (response.success && response.assessment) {
          results.assessmentId = response.assessment._id;
        }
      } catch (error) {
        console.error('Error submitting to backend:', error);
        // Continue with local completion even if backend submission fails
      }
      
      // Complete assessment
      onComplete(results);
    } catch (error) {
      console.error("Error submitting assessment:", error);
      // Show error message to user
      alert("There was an error submitting your assessment. Please try again.");
    }
  };

  const getQuestionsByLevelAndLanguage = (level, language) => {
    // In a real app, these would come from a database
    // We're simulating different questions for different levels
    
    const questionsByLevel = {
      'a1': [
        {
          id: 1,
          text: language === 'english' ? 
            'Read the following text: "John is a student. He studies at the university. He likes to read books."' : 
            'Lisez le texte suivant: "Jean est étudiant. Il étudie à l\'université. Il aime lire des livres."',
          question: language === 'english' ? 'What does John like to do?' : 'Qu\'est-ce que Jean aime faire?',
          options: language === 'english' ? 
            ['Study at university', 'Read books', 'Write essays', 'Play sports'] : 
            ['Étudier à l\'université', 'Lire des livres', 'Écrire des essais', 'Faire du sport'],
          correctAnswer: 1
        },
        {
          id: 2,
          text: language === 'english' ? 
            'Read the sign: "No smoking"' : 
            'Lisez le panneau: "Défense de fumer"',
          question: language === 'english' ? 'What is not allowed?' : 'Qu\'est-ce qui n\'est pas autorisé?',
          options: language === 'english' ? 
            ['Eating', 'Drinking', 'Smoking', 'Talking'] : 
            ['Manger', 'Boire', 'Fumer', 'Parler'],
          correctAnswer: 2
        },
        {
          id: 3,
          text: language === 'english' ? 
            'Read the menu: "Coffee - $2, Tea - $1.50, Water - $1"' : 
            'Lisez le menu: "Café - 2€, Thé - 1,50€, Eau - 1€"',
          question: language === 'english' ? 'Which is the most expensive?' : 'Quel est le plus cher?',
          options: language === 'english' ? 
            ['Coffee', 'Tea', 'Water', 'All are the same price'] : 
            ['Café', 'Thé', 'Eau', 'Tous ont le même prix'],
          correctAnswer: 0
        }
      ],
      'b1': [
        {
          id: 1,
          text: language === 'english' ? 
            'The Internet has transformed how we communicate. Social media platforms allow people to connect instantly across the globe. However, some critics argue that these digital connections are less meaningful than face-to-face interactions.' : 
            'Internet a transformé notre façon de communiquer. Les plateformes de médias sociaux permettent aux gens de se connecter instantanément à travers le monde. Cependant, certains critiques soutiennent que ces connexions numériques sont moins significatives que les interactions en face à face.',
          question: language === 'english' ? 'What concern do critics have about social media?' : 'Quelle préoccupation les critiques ont-ils concernant les médias sociaux?',
          options: language === 'english' ? 
            ['It is too expensive', 'It causes technical problems', 'Connections are less meaningful than in-person', 'It uses too much electricity'] : 
            ['C\'est trop cher', 'Cela cause des problèmes techniques', 'Les connexions sont moins significatives qu\'en personne', 'Cela utilise trop d\'électricité'],
          correctAnswer: 2
        },
        {
          id: 2,
          text: language === 'english' ? 
            'Climate change is one of the most pressing issues of our time. Rising global temperatures have led to more extreme weather events, including hurricanes, droughts, and floods. Many countries are now working to reduce carbon emissions.' : 
            'Le changement climatique est l\'un des problèmes les plus urgents de notre époque. La hausse des températures mondiales a entraîné des événements météorologiques plus extrêmes, notamment des ouragans, des sécheresses et des inondations. De nombreux pays travaillent maintenant à réduire les émissions de carbone.',
          question: language === 'english' ? 'What have rising global temperatures caused?' : 'Qu\'est-ce que la hausse des températures mondiales a causé?',
          options: language === 'english' ? 
            ['More international cooperation', 'Extreme weather events', 'Reduced energy costs', 'Better crop yields'] : 
            ['Plus de coopération internationale', 'Des événements météorologiques extrêmes', 'Réduction des coûts énergétiques', 'De meilleurs rendements des cultures'],
          correctAnswer: 1
        },
        {
          id: 3,
          text: language === 'english' ? 
            'Many nutritionists recommend eating a balanced diet that includes fruits, vegetables, whole grains, and lean proteins. Processed foods often contain high levels of sugar, salt, and unhealthy fats, which can contribute to health problems when consumed in excess.' : 
            'De nombreux nutritionnistes recommandent de manger un régime équilibré qui comprend des fruits, des légumes, des céréales complètes et des protéines maigres. Les aliments transformés contiennent souvent des niveaux élevés de sucre, de sel et de graisses malsaines, qui peuvent contribuer à des problèmes de santé lorsqu\'ils sont consommés en excès.',
          question: language === 'english' ? 'What potential issue is associated with processed foods?' : 'Quel problème potentiel est associé aux aliments transformés?',
          options: language === 'english' ? 
            ['They are too expensive', 'They spoil quickly', 'They contain unhealthy ingredients', 'They take too long to prepare'] : 
            ['Ils sont trop chers', 'Ils se gâtent rapidement', 'Ils contiennent des ingrédients malsains', 'Ils prennent trop de temps à préparer'],
          correctAnswer: 2
        }
      ],
      'c1': [
        {
          id: 1,
          text: language === 'english' ? 
            'The proliferation of artificial intelligence technologies has sparked vigorous debate among ethicists, technologists, and policymakers. While proponents highlight AI\'s potential to revolutionize healthcare, transportation, and other sectors, critics caution about unintended consequences, including algorithmic bias, privacy concerns, and potential job displacement. A nuanced regulatory framework that balances innovation with ethical considerations remains elusive but increasingly necessary.' : 
            'La prolifération des technologies d\'intelligence artificielle a suscité un vif débat parmi les éthiciens, les technologues et les décideurs politiques. Si les partisans soulignent le potentiel de l\'IA à révolutionner les soins de santé, les transports et d\'autres secteurs, les critiques mettent en garde contre les conséquences imprévues, notamment les biais algorithmiques, les problèmes de confidentialité et les déplacements d\'emplois potentiels. Un cadre réglementaire nuancé qui équilibre l\'innovation avec des considérations éthiques reste insaisissable mais de plus en plus nécessaire.',
          question: language === 'english' ? 'What remains challenging but increasingly important according to the text?' : 'Qu\'est-ce qui reste difficile mais de plus en plus important selon le texte?',
          options: language === 'english' ? 
            ['Developing faster AI algorithms', 'Creating more AI applications', 'Balancing innovation with ethical regulations', 'Reducing the cost of AI implementation'] : 
            ['Développer des algorithmes d\'IA plus rapides', 'Créer plus d\'applications d\'IA', 'Équilibrer l\'innovation avec des réglementations éthiques', 'Réduire le coût de mise en œuvre de l\'IA'],
          correctAnswer: 2
        },
        {
          id: 2,
          text: language === 'english' ? 
            'Contemporary literary criticism has evolved substantially since its formalist origins. Post-structuralist approaches challenge the notion of fixed textual meaning, while postcolonial critics examine literature through the lens of imperial power dynamics. Feminist literary theory interrogates gender representations, and digital humanities now employs computational methods to analyze vast textual corpora. These diverse methodologies reflect the field\'s adaptation to changing intellectual and cultural landscapes.' : 
            'La critique littéraire contemporaine a considérablement évolué depuis ses origines formalistes. Les approches post-structuralistes remettent en question la notion de signification textuelle fixe, tandis que les critiques postcoloniales examinent la littérature à travers le prisme des dynamiques de pouvoir impérial. La théorie littéraire féministe interroge les représentations de genre, et les humanités numériques emploient désormais des méthodes computationnelles pour analyser de vastes corpus textuels. Ces méthodologies diverses reflètent l\'adaptation du domaine aux paysages intellectuels et culturels changeants.',
          question: language === 'english' ? 'What does the diversity of literary criticism methodologies demonstrate?' : 'Que démontre la diversité des méthodologies de critique littéraire?',
          options: language === 'english' ? 
            ['The superiority of newer approaches', 'The field\'s adaptation to changing contexts', 'The decline of traditional analysis', 'The need for standardized methods'] : 
            ['La supériorité des approches plus récentes', 'L\'adaptation du domaine aux contextes changeants', 'Le déclin de l\'analyse traditionnelle', 'Le besoin de méthodes standardisées'],
          correctAnswer: 1
        },
        {
          id: 3,
          text: language === 'english' ? 
            'The microbiome comprises trillions of microorganisms residing within the human body that significantly influence physiological processes. Recent research has established correlations between gut microbial composition and various health conditions, including inflammatory disorders, metabolic syndromes, and even neurological states. This emerging understanding suggests potential therapeutic interventions targeting the microbiome, although translating laboratory findings to clinical applications presents considerable challenges due to the microbiome\'s complexity and individual variability.' : 
            'Le microbiome comprend des billions de micro-organismes résidant dans le corps humain qui influencent significativement les processus physiologiques. Des recherches récentes ont établi des corrélations entre la composition microbienne intestinale et diverses conditions de santé, y compris les troubles inflammatoires, les syndromes métaboliques, et même les états neurologiques. Cette compréhension émergente suggère des interventions thérapeutiques potentielles ciblant le microbiome, bien que la traduction des résultats de laboratoire aux applications cliniques présente des défis considérables en raison de la complexité du microbiome et de la variabilité individuelle.',
          question: language === 'english' ? 'What challenge exists in developing microbiome-based treatments?' : 'Quel défi existe dans le développement de traitements basés sur le microbiome?',
          options: language === 'english' ? 
            ['Insufficient research funding', 'Microbiome complexity and individual differences', 'Lack of interest from pharmaceutical companies', 'Regulatory obstacles'] : 
            ['Financement insuffisant de la recherche', 'Complexité du microbiome et différences individuelles', 'Manque d\'intérêt des entreprises pharmaceutiques', 'Obstacles réglementaires'],
          correctAnswer: 1
        }
      ]
    };
    
    // If level not found, default to A1 or closest available
    const levelQuestions = questionsByLevel[level] || questionsByLevel['a1'];
    
    // Create a deep copy to avoid state mutation issues
    return JSON.parse(JSON.stringify(levelQuestions));
  };

  const handleAnswer = (answerIndex) => {
    const newAnswers = [...multipleChoiceAnswers];
    newAnswers[currentQuestion] = answerIndex;
    setMultipleChoiceAnswers(newAnswers);
  };

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  // Check if a word is currently being used in any sentence
  const isWordSelected = (word) => {
    return Object.keys(selectedWords).includes(word);
  };

  // Render assessment unavailable message
  const renderUnavailableMessage = () => {
    if (!assessmentAvailability) return null;
    
    const nextDate = new Date(assessmentAvailability.nextAvailableDate);
    
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="mb-6 border-l-4 border-blue-500 p-6 rounded-lg mb-6">
          <div className="flex items-start">
            <div className="flex-shrink-0 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-800 mb-2">Assessment Cooldown Period</h3>
              <p className="text-blue-700 mb-3">
                You've already taken this reading assessment. Our system enforces a 7-day waiting period between assessment attempts to ensure meaningful progress tracking.
              </p>
              <p className="text-blue-700 font-medium">
                You can take this assessment again on {nextDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.
              </p>
              
              {assessmentAvailability.previousAssessment && (
                <div className="mt-5 pt-4 border-t border-blue-200">
                  <h4 className="font-medium text-blue-800 mb-2">Your Previous Result</h4>
                  <div className="flex items-center">
                    <div className="w-16 h-16 rounded-full bg-white border-2 border-blue-300 flex items-center justify-center mr-4">
                      <span className="text-xl font-bold text-blue-700">
                        {Math.round(assessmentAvailability.previousScore)}%
                      </span>
                    </div>
                    <div>
                      <p className="text-blue-700">Completed on: {new Date(assessmentAvailability.previousAssessment.completedAt).toLocaleDateString()}</p>
                      <p className="text-blue-700">Score: {assessmentAvailability.previousScore.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="mt-6">
                <button 
                  onClick={onBack} 
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
                  Return to Assessments
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render loading state
  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#592538] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading assessment data...</p>
          <p className="text-gray-400 text-sm mt-2">Level: {level}, Language: {language}</p>
        </div>
      </div>
    );
  }

  // Render assessment unavailable message if applicable
  if (assessmentUnavailable) {
    return renderUnavailableMessage();
  }

  // Render the main assessment UI
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h2 className="text-2xl font-bold text-[#592538]">
            Reading Assessment - {level.toUpperCase()}
          </h2>
          <div className="flex items-center space-x-4">
            <div className="px-4 py-2 bg-[#592538]/10 rounded-lg text-[#592538] font-medium flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              {formatTime(timeLeft)}
            </div>
            <button 
              onClick={onBack}
              className="px-4 py-2 text-sm font-medium text-[#592538] rounded-lg border border-[#592538] hover:bg-[#592538] hover:text-white transition-colors"
            >
              Exit Assessment
            </button>
          </div>
        </div>

        {/* Title and Instructions */}
        <div className="mb-8">
          <h3 className="text-xl font-medium mb-4 text-gray-800">
            {assessmentData?.title || "Reading Assessment"}
          </h3>
          
          {/* Navigation Tabs */}
          <div className="flex border-b border-gray-200 mb-6">
            <button
              className={`py-3 px-6 border-b-2 font-medium text-sm ${
                activeTab === 'reading'
                  ? 'border-[#592538] text-[#592538]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('reading')}
            >
              Reading Text
            </button>
            <button
              className={`py-3 px-6 border-b-2 font-medium text-sm ${
                activeTab === 'tasks'
                  ? 'border-[#592538] text-[#592538]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('tasks')}
            >
              Tasks
            </button>
          </div>
          
          {/* Reading Text Tab */}
          {activeTab === 'reading' && (
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <div className="whitespace-pre-line text-gray-700 p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
                {assessmentData?.text || "No text available for this assessment."}
              </div>
            </div>
          )}
          
          {/* Tasks Tab */}
          {activeTab === 'tasks' && (
            <div className="space-y-8">
              {/* Multiple Choice Questions */}
              {assessmentData?.multipleChoiceQuestions && assessmentData.multipleChoiceQuestions.length > 0 && (
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                  <h4 className="font-medium text-lg mb-3 text-[#592538] flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                    Task 1
                  </h4>
                  <p className="text-gray-700 mb-5 pl-7">Choose the best answer for each question.</p>

                  <div className="space-y-6">
                    {assessmentData.multipleChoiceQuestions.map((question, questionIndex) => (
                      <div key={questionIndex} className="border border-gray-200 rounded-lg p-5 hover:border-gray-300 transition-colors">
                        <p className="text-[#592538] font-medium mb-4">{questionIndex + 1}. {question.question}</p>
                        <div className="space-y-3 pl-2">
                          {question.options.map((option, optionIndex) => (
                            <div
                              key={optionIndex}
                              className={`p-3 border rounded-lg cursor-pointer transition-all ${
                                multipleChoiceAnswers[questionIndex] === optionIndex
                                  ? 'border-[#592538] bg-[#592538]/5 shadow-sm'
                                  : 'border-gray-200 hover:border-[#592538]/30 hover:bg-gray-50'
                              }`}
                              onClick={() => handleMultipleChoiceAnswer(questionIndex, optionIndex)}
                            >
                              <div className="flex items-center">
                                <div className={`h-5 w-5 rounded-full mr-3 flex items-center justify-center border transition-colors ${
                                  multipleChoiceAnswers[questionIndex] === optionIndex
                                    ? 'bg-[#592538] border-[#592538]'
                                    : 'border-gray-400'
                                }`}>
                                  {multipleChoiceAnswers[questionIndex] === optionIndex && (
                                    <div className="h-2 w-2 rounded-full bg-white"></div>
                                  )}
                                </div>
                                <span className={multipleChoiceAnswers[questionIndex] === optionIndex ? 'font-medium' : ''}>{option}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* True/False Questions */}
              {assessmentData?.trueFalseQuestions && assessmentData.trueFalseQuestions.length > 0 && (
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                  <h4 className="font-medium text-lg mb-3 text-[#592538] flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {assessmentData?.multipleChoiceQuestions ? 'Task 2' : 'Task 1'}
                  </h4>
                  <p className="text-gray-700 mb-5 pl-7">Are the sentences true or false?</p>

                  <div className="space-y-4">
                    {assessmentData.trueFalseQuestions.map((question, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                        <div className="flex justify-between items-center flex-wrap gap-4">
                          <p className="text-[#592538] font-medium">{index + 1}. {question.statement}</p>
                          <div className="flex space-x-3">
                            <button
                              onClick={() => handleTrueFalseAnswer(index, true)}
                              className={`px-5 py-2 rounded-md transition-all ${
                                trueFalseAnswers[index] === true
                                  ? 'bg-[#592538] text-white shadow-sm'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              <div className="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                True
                              </div>
                            </button>
                            <button
                              onClick={() => handleTrueFalseAnswer(index, false)}
                              className={`px-5 py-2 rounded-md transition-all ${
                                trueFalseAnswers[index] === false
                                  ? 'bg-[#592538] text-white shadow-sm'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              <div className="flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                                False
                              </div>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Categorization Task */}
              {assessmentData?.categorization && (
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                  <h4 className="font-medium text-lg mb-3 text-[#592538] flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm0 2h10v10H5V5z" clipRule="evenodd" />
                    </svg>
                    {assessmentData?.title || "Task"}
                  </h4>
                  <p className="text-gray-700 mb-5 pl-7">{assessmentData.categorization.instructions}</p>

                  <div className="grid grid-cols-1 gap-6">
                    {/* Uncategorized items */}
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <h5 className="font-medium mb-3 text-gray-700">Items to categorize:</h5>
                      <div className="flex flex-wrap gap-2">
                        {assessmentData.categorization.items
                          .filter(item => categorizationAnswers[item.id] === null)
                          .map(item => (
                            <div
                              key={item.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, item.id)}
                              className="px-3 py-2 bg-white border border-gray-300 rounded-md cursor-move shadow-sm hover:shadow-md transition-shadow"
                            >
                              {item.text}
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Categories */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {assessmentData.categorization.categories.map(category => (
                        <div
                          key={category.id}
                          className="border border-gray-200 rounded-lg p-4 h-full"
                          onDrop={(e) => handleDrop(e, category.id)}
                          onDragOver={handleDragOver}
                        >
                          <h5 className="font-medium text-center p-2 mb-3 bg-[#592538] text-white rounded-md">
                            {category.name}
                          </h5>
                          <div className="min-h-32 flex flex-col gap-2">
                            {getItemsInCategory(category.id).map(itemId => {
                              const item = assessmentData.categorization.items.find(i => i.id === itemId);
                              return item ? (
                                <div 
                                  key={item.id} 
                                  className="px-3 py-2 bg-white border border-gray-300 rounded-md flex justify-between items-center"
                                >
                                  <span>{item.text}</span>
                                  <button 
                                    onClick={() => resetCategorizationItem(item.id)}
                                    className="text-gray-400 hover:text-[#592538] transition-colors"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                  </button>
                                </div>
                              ) : null;
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Fill in the Blanks */}
              {assessmentData?.fillInBlanks && (
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                  <h4 className="font-medium text-lg mb-3 text-[#592538] flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                    {(!assessmentData?.multipleChoiceQuestions && !assessmentData?.trueFalseQuestions && !assessmentData?.categorization) 
                      ? 'Task 1' 
                      : (!assessmentData?.multipleChoiceQuestions && !assessmentData?.trueFalseQuestions) || 
                        (!assessmentData?.multipleChoiceQuestions && !assessmentData?.categorization) || 
                        (!assessmentData?.trueFalseQuestions && !assessmentData?.categorization)
                        ? 'Task 2' 
                        : 'Task 3'}
                  </h4>
                  <p className="text-gray-700 mb-5 pl-7">{assessmentData.fillInBlanks.instructions}</p>

                  <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 mb-6">
                    <h5 className="font-medium mb-4 text-gray-700 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                      </svg>
                      Available words:
                    </h5>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-center">
                      {assessmentData.fillInBlanks.words.map((word, index) => (
                        <div 
                          key={index} 
                          className={`p-2 text-lg font-medium border rounded-md cursor-pointer transition-all ${
                            isWordSelected(word) 
                              ? 'opacity-50 bg-gray-100 border-gray-300 cursor-not-allowed' 
                              : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm'
                          }`}
                          onClick={() => {
                            if (!isWordSelected(word)) {
                              // Find first empty sentence
                              const emptyKey = Object.entries(fillBlanksAnswers)
                                .find(([key, value]) => value === "")
                                ?.[0];
                              
                              if (emptyKey) {
                                handleFillBlanksAnswer(parseInt(emptyKey), word);
                              }
                            }
                          }}
                        >
                          {word}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-5">
                    {assessmentData.fillInBlanks.sentences.map((sentence, index) => {
                      // Find where the blank should be in the sentence text
                      const textWithBlank = sentence.text.replace("____________", "______");
                      const parts = textWithBlank.split("______");
                      
                      return (
                        <div key={sentence.id} className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                          <span className="text-lg font-medium text-[#592538] mr-2">{index + 1}.</span>
                          <div className="flex flex-wrap items-center">
                            <span className="text-lg">{parts[0]}</span>
                            <div 
                              className={`min-w-40 h-10 mx-2 border-b-2 border-dashed flex items-center justify-center transition-colors ${
                                fillBlanksAnswers[sentence.id] ? 'border-[#592538]' : 'border-gray-400'
                              }`}
                              onClick={() => {
                                if (!fillBlanksAnswers[sentence.id]) {
                                  // Find first unused word
                                  const unusedWord = assessmentData.fillInBlanks.words.find(
                                    word => !isWordSelected(word)
                                  );
                                  
                                  if (unusedWord) {
                                    handleFillBlanksAnswer(sentence.id, unusedWord);
                                  }
                                }
                              }}
                            >
                              {fillBlanksAnswers[sentence.id] ? (
                                <div className="flex items-center justify-between w-full px-4">
                                  <span className="font-medium text-[#592538]">{fillBlanksAnswers[sentence.id]}</span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      clearFillBlankAnswer(sentence.id);
                                    }}
                                    className="text-gray-400 hover:text-[#592538] transition-colors"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                  </button>
                                </div>
                              ) : (
                                <span className="text-gray-400 text-sm px-4">Click to add a word</span>
                              )}
                            </div>
                            <span className="text-lg">{parts[1]}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Submit Button */}
          <div className="flex justify-end pt-6 mt-6 border-t border-gray-200">
            <button
              onClick={handleSubmit}
              className={`px-6 py-3 bg-[#592538] text-white rounded-lg hover:bg-[#6d2c44] flex items-center shadow-md transition-all ${
                !allQuestionsAnswered() ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'
              }`}
              disabled={!allQuestionsAnswered()}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Submit Assessment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReadingAssessment; 