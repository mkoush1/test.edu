import axios from 'axios';

// Try to use environment variables first, then fallback to origin or localhost
const API_URL = import.meta.env.VITE_API_URL || 
                window.location.origin + '/api' || 
                'http://localhost:5003/api';

// Log the API URL for debugging
console.log("WritingAssessmentService using API URL:", API_URL);

const API_TIMEOUT = 45000; // Increased timeout to 45 seconds for better AI response handling

/**
 * Service for interacting with the AI writing assessment API
 */
class WritingAssessmentService {
  constructor() {
    console.log("WritingAssessmentService initialized with API URL:", API_URL);
    
    // Create axios instance with timeout
    this.api = axios.create({
      baseURL: API_URL,
      timeout: API_TIMEOUT
    });
  }

  /**
   * Generate a new writing prompt based on the level and language
   * @param {string} level - CEFR level (a1, a2, b1, b2, c1, c2)
   * @param {string} language - Language (english, french)
   * @returns {Promise<Object>} - Generated prompt with title, instructions, time limit, word limit, and criteria
   */
  async generatePrompt(level, language) {
    try {
      console.log(`Generating writing prompt for level: ${level}, language: ${language}, API URL: ${API_URL}`);
      
      // Generate a unique request ID to track this specific request
      const requestId = `prompt_${level}_${language}_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      console.log(`Request ID: ${requestId}`);
      
      // Log the full URL for debugging
      const fullUrl = `${API_URL}/writing-assessment/generate-prompt?level=${level}&language=${language}`;
      console.log(`Full request URL: ${fullUrl}`);
      
      // Use a retry mechanism for better reliability
      let attempts = 0;
      const maxAttempts = 2;
      let lastError = null;
      
      while (attempts < maxAttempts) {
        try {
          attempts++;
          console.log(`Attempt ${attempts}/${maxAttempts} to generate writing prompt (Request ID: ${requestId})`);
          
          // Make a direct axios call for better debugging
          const response = await axios({
            method: 'get',
            url: fullUrl,
            timeout: API_TIMEOUT,
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'X-Request-ID': requestId // Add request ID to headers
            }
          });
          
          console.log(`Received prompt generation response (Request ID: ${requestId})`, {
            status: response.status,
            statusText: response.statusText,
            success: response.data?.success,
            hasPrompt: !!response.data?.prompt,
            fromCache: !!response.data?.fromCache,
            fromParallelRequest: !!response.data?.fromParallelRequest,
            canTakeAssessment: response.data?.canTakeAssessment !== false, // undefined means can take
            dataKeys: Object.keys(response.data || {})
          });
          
          // Check if we got valid data
          if (!response.data?.success || !response.data?.prompt) {
            console.error(`Invalid response data (Request ID: ${requestId}):`, response.data);
            throw new Error(response.data?.message || 'No prompt data received from the API');
          }
          
          // Get the prompt and any additional data
          const prompt = response.data.prompt;
          
          // If the response includes availability information, add it to the prompt
          if (response.data.canTakeAssessment === false) {
            prompt.isLastAssessment = true;
            prompt.nextAvailableDate = response.data.nextAvailableDate;
          }
          
          // Log the prompt details
          console.log(`Successfully generated prompt (Request ID: ${requestId}):`, {
            title: prompt.title,
            prompt: prompt.prompt?.substring(0, 50) + "...",
            timeLimit: prompt.timeLimit,
            wordLimit: prompt.wordLimit,
            criteria: prompt.criteria?.map(c => c.substring(0, 20) + "...") || [],
            isLastAssessment: !!prompt.isLastAssessment
          });
          
          return prompt;
        } catch (error) {
          console.error(`Error on attempt ${attempts} (Request ID: ${requestId}):`, error.message);
          lastError = error;
          
          // Only retry on network errors or timeouts
          if (!error.response && attempts < maxAttempts) {
            console.log(`Retrying after error (Request ID: ${requestId}): ${error.message}`);
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
          } else {
            throw error;
          }
        }
      }
      
      throw lastError;
    } catch (error) {
      console.error('Error generating writing prompt:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response ? {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        } : 'No response data'
      });
      
      // Instead of falling back to default prompt, throw the error
      // to let the component handle it
      const errorMessage = error.response?.data?.message || error.message || 'Failed to generate writing prompt';
      throw new Error(errorMessage);
    }
  }
  
  /**
   * Get a default writing prompt when API call fails
   * @param {string} level - CEFR level
   * @param {string} language - Language
   * @returns {Object} - Default prompt
   */
  getDefaultPrompt(level, language) {
    const isEnglish = language.toLowerCase() === 'english';
    const levelLower = level.toLowerCase();
    
    // Add some variety by using a random selection of prompts for each level
    const getRandomPrompt = (prompts) => {
      const index = Math.floor(Math.random() * prompts.length);
      return prompts[index];
    };
    
    // Define multiple prompts for each level
    const a1Prompts = isEnglish ? [
      {
        title: 'Simple Introduction',
        prompt: 'Write a short paragraph about yourself (name, age, nationality, job/studies, hobbies).',
        timeLimit: 10,
        wordLimit: 50,
        criteria: ['Basic Vocabulary', 'Simple Sentences', 'Personal Information']
      },
      {
        title: 'My Family',
        prompt: 'Write a short paragraph about your family. Who are they? What do they do?',
        timeLimit: 10,
        wordLimit: 50,
        criteria: ['Basic Vocabulary', 'Simple Sentences', 'Family Vocabulary']
      },
      {
        title: 'My Home',
        prompt: 'Describe your home or apartment. What rooms do you have? What is your favorite room?',
        timeLimit: 10,
        wordLimit: 50,
        criteria: ['Basic Vocabulary', 'Simple Sentences', 'Home Vocabulary']
      }
    ] : [
      {
        title: 'Présentation Simple',
        prompt: 'Écrivez un court paragraphe sur vous-même (nom, âge, nationalité, travail/études, loisirs).',
        timeLimit: 10,
        wordLimit: 50,
        criteria: ['Vocabulaire de Base', 'Phrases Simples', 'Informations Personnelles']
      },
      {
        title: 'Ma Famille',
        prompt: 'Écrivez un court paragraphe sur votre famille. Qui sont-ils? Que font-ils?',
        timeLimit: 10,
        wordLimit: 50,
        criteria: ['Vocabulaire de Base', 'Phrases Simples', 'Vocabulaire de la Famille']
      }
    ];
    
    const b1Prompts = isEnglish ? [
      {
        title: 'Personal Experience',
        prompt: 'Write about a memorable trip or vacation you have taken. Describe where you went, who you were with, what you did, and why it was memorable.',
        timeLimit: 20,
        wordLimit: 150,
        criteria: ['Past Tense Narration', 'Descriptive Language', 'Logical Sequence', 'Personal Reflection']
      },
      {
        title: 'Career Goals',
        prompt: 'Describe your career goals for the next five years. What do you want to achieve and how do you plan to reach these goals?',
        timeLimit: 20,
        wordLimit: 150,
        criteria: ['Future Tense Usage', 'Goal Setting Vocabulary', 'Logical Planning', 'Personal Ambition']
      },
      {
        title: 'Technology Impact',
        prompt: 'Describe how technology has changed your daily life. Give specific examples of positive and negative impacts.',
        timeLimit: 20,
        wordLimit: 150,
        criteria: ['Present Perfect Usage', 'Technology Vocabulary', 'Cause and Effect', 'Opinion Expression']
      }
    ] : [
      {
        title: 'Expérience Personnelle',
        prompt: 'Écrivez à propos d\'un voyage ou de vacances mémorables que vous avez fait. Décrivez où vous êtes allé, avec qui vous étiez, ce que vous avez fait et pourquoi c\'était mémorable.',
        timeLimit: 20,
        wordLimit: 150,
        criteria: ['Narration au Passé', 'Langage Descriptif', 'Séquence Logique', 'Réflexion Personnelle']
      },
      {
        title: 'Objectifs de Carrière',
        prompt: 'Décrivez vos objectifs de carrière pour les cinq prochaines années. Que voulez-vous réaliser et comment prévoyez-vous d\'atteindre ces objectifs?',
        timeLimit: 20,
        wordLimit: 150,
        criteria: ['Utilisation du Futur', 'Vocabulaire des Objectifs', 'Planification Logique', 'Ambition Personnelle']
      }
    ];
    
    // Select the appropriate array of prompts based on level
    let promptOptions;
    
    if (levelLower === 'a1') {
      promptOptions = a1Prompts;
    } else if (levelLower === 'a2') {
      // For brevity, we'll reuse some prompts with modifications
      promptOptions = a1Prompts.map(p => ({
        ...p,
        timeLimit: 15,
        wordLimit: 80,
        criteria: [...p.criteria, isEnglish ? 'Present Tense Usage' : 'Utilisation du Présent']
      }));
    } else if (levelLower === 'b1') {
      promptOptions = b1Prompts;
    } else if (levelLower === 'b2') {
      // For brevity, we'll reuse some prompts with modifications
      promptOptions = b1Prompts.map(p => ({
        ...p,
        timeLimit: 30,
        wordLimit: 200,
        criteria: [...p.criteria, isEnglish ? 'Complex Structures' : 'Structures Complexes']
      }));
    } else {
      // C1 and C2
      promptOptions = [
        {
          title: isEnglish ? 'Argumentative Essay' : 'Essai Argumentatif',
          prompt: isEnglish ? 
            'Write an essay discussing whether social media has had a positive or negative impact on society. Present arguments for both sides and state your own opinion with supporting reasons.' : 
            'Rédigez un essai discutant si les médias sociaux ont eu un impact positif ou négatif sur la société. Présentez des arguments pour les deux côtés et donnez votre propre opinion avec des raisons à l\'appui.',
          timeLimit: 40,
          wordLimit: 300,
          criteria: [
            isEnglish ? 'Advanced Vocabulary' : 'Vocabulaire Avancé',
            isEnglish ? 'Complex Structures' : 'Structures Complexes',
            isEnglish ? 'Cohesive Arguments' : 'Arguments Cohésifs',
            isEnglish ? 'Critical Thinking' : 'Pensée Critique',
            isEnglish ? 'Academic Register' : 'Registre Académique'
          ]
        }
      ];
    }
    
    // Get a random prompt from the options
    return getRandomPrompt(promptOptions);
  }

  /**
   * Evaluate a writing submission using AI
   * @param {string} question - The prompt or question the user responded to
   * @param {string} answer - The user's written answer
   * @returns {Promise<Object>} - Assessment results with scores for each criteria
   */
  async evaluateWriting(question, answer) {
    try {
      console.log("Evaluating writing submission...", {
        questionLength: question?.length || 0,
        answerLength: answer?.length || 0,
        apiUrl: API_URL
      });
      
      // No early fallback - always try the AI service first
      const response = await this.api.post(`/writing-assessment/evaluate`, {
        question,
        answer
      });
      
      console.log("Received assessment response", {
        success: response.data?.success,
        hasAssessment: !!response.data?.assessment
      });
      
      if (!response.data?.assessment) {
        throw new Error('No assessment data received from the API');
      }
      
      return response.data.assessment;
    } catch (error) {
      console.error('Error in evaluateWriting service:', error);
      
      // Only use fallback in case of network errors or server unavailability
      if (error.response?.status === 404 || !error.response || error.code === 'ECONNABORTED') {
        console.warn('Falling back to client-side assessment simulation due to:', error.message);
        return this.simulateAssessment(answer);
      }
      
      // Throw error with more information for debugging
      const enhancedError = new Error(`API Error: ${error.message} - Status: ${error.response?.status || 'None'}`);
      enhancedError.originalError = error;
      throw enhancedError;
    }
  }
  
  /**
   * Simulate an assessment in case the API is unavailable (fallback method)
   * @param {string} answer - The user's written answer
   * @returns {Object} - Simulated assessment data
   */
  simulateAssessment(answer) {
    console.warn('Using simulated assessment. This should only happen if the AI service is unavailable.');
    
    // Basic metrics for simple assessment
    const wordCount = (answer || '').split(/\s+/).filter(Boolean).length;
    const sentenceCount = (answer || '').split(/[.!?]+/).filter(Boolean).length;
    const avgSentenceLength = sentenceCount > 0 ? wordCount / sentenceCount : 0;
    const paragraphCount = (answer || '').split(/\n\s*\n/).filter(Boolean).length;
    
    // Apply a severe penalty for minimal responses
    const minimalResponse = wordCount < 10;
    const veryMinimalResponse = wordCount < 3;
    
    // Compute basic scores based on simple metrics (out of 10)
    // Apply strict penalties for minimal responses
    let coherenceScore = minimalResponse ? 1 : paragraphCount > 1 ? 7 : 5;
    let organizationScore = minimalResponse ? 1 : paragraphCount >= 3 ? 8 : 6;
    let focusScore = minimalResponse ? 1 : wordCount > 150 ? 7 : 5;
    let vocabularyScore = minimalResponse ? 1 : this.calculateVocabularyScore(answer); // Already on scale of 10
    let grammarScore = minimalResponse ? 1 : 7; // Default without actual analysis
    
    // For extremely minimal responses (like one nonsensical word), make scores even lower
    if (veryMinimalResponse) {
      coherenceScore = 0.5;
      organizationScore = 0.5;
      focusScore = 0.5;
      vocabularyScore = 0.5;
      grammarScore = 0.5;
    }
    
    // Prepare criteria array
    const criteria = [
      {
        name: 'Coherence and Clarity',
        score: coherenceScore,
        feedback: veryMinimalResponse 
          ? 'The response is too brief to evaluate coherence. A complete response with multiple sentences is required.'
          : minimalResponse
            ? 'The response lacks coherence due to insufficient content. More development is needed.'
            : coherenceScore >= 7 
              ? 'Your ideas flow logically and are easy to follow.' 
              : 'Try to improve the logical flow between your ideas.'
      },
      {
        name: 'Organization and Structure',
        score: organizationScore,
        feedback: veryMinimalResponse
          ? 'The response is too brief to evaluate organization. A complete response with clear structure is required.'
          : minimalResponse
            ? 'The response lacks organization due to insufficient content. A proper structure is needed.'
            : organizationScore >= 7 
              ? 'Your writing has good structure with clear sections.' 
              : 'Consider organizing your writing with clearer introduction, body, and conclusion.'
      },
      {
        name: 'Focus and Content Development',
        score: focusScore,
        feedback: veryMinimalResponse
          ? 'The response is too brief to evaluate focus. A complete response addressing the prompt is required.'
          : minimalResponse
            ? 'The response lacks focus and does not adequately address the prompt. More content is needed.'
            : focusScore >= 7 
              ? 'You stay on topic and develop your ideas well.' 
              : 'Try to stay more focused on the main topic and develop your ideas further.'
      },
      {
        name: 'Vocabulary and Word Choice',
        score: vocabularyScore,
        feedback: veryMinimalResponse
          ? 'The response is too brief to evaluate vocabulary. A complete response with varied vocabulary is required.'
          : minimalResponse
            ? 'The response contains very limited vocabulary. More varied and appropriate word choices are needed.'
            : vocabularyScore >= 7 
              ? 'You use a good range of vocabulary.' 
              : 'Try to use more varied vocabulary to express your ideas.'
      },
      {
        name: 'Grammar and Conventions',
        score: grammarScore,
        feedback: veryMinimalResponse
          ? 'The response is too brief to evaluate grammar. A complete response with proper grammar is required.'
          : minimalResponse
            ? 'The response contains too little content to properly assess grammar. More complete sentences are needed.'
            : 'Your grammar is generally good, but there may be areas for improvement.'
      }
    ];
    
    // Calculate overall score by summing the criteria scores and converting to percentage
    const totalPoints = criteria.reduce((sum, criterion) => sum + criterion.score, 0);
    const overallScore = Math.round((totalPoints / 50) * 100); // Convert to percentage (out of 100)
    
    // Log scoring for debugging
    console.log("Simulated assessment scores:", {
      coherence: coherenceScore,
      organization: organizationScore,
      focus: focusScore,
      vocabulary: vocabularyScore,
      grammar: grammarScore,
      totalPoints,
      overallScore
    });
    
    return {
      criteria: criteria,
      overallScore: overallScore,
      overallFeedback: veryMinimalResponse 
        ? 'This response is far too brief and does not meet the minimum requirements for assessment. Please provide a complete response that addresses the prompt.'
        : minimalResponse
          ? 'This response is too brief to demonstrate writing proficiency. Please develop your ideas more fully and address all aspects of the prompt.'
          : overallScore >= 80 
            ? 'Your writing sample demonstrates strong academic writing skills. You communicate effectively with good organization and vocabulary.' 
            : overallScore >= 60 
              ? 'Your writing sample demonstrates adequate academic writing skills. Continue practicing to improve your writing skills.'
              : 'Your writing sample demonstrates developing academic writing skills. Continue practicing to improve your organization, coherence, and content development.',
      recommendations: [
        'Practice writing every day to improve your skills.',
        'Read widely to expand your vocabulary and understanding of different writing styles.',
        'Review grammar rules and punctuation to ensure clarity in your writing.'
      ]
    };
  }
  
  /**
   * Calculate a basic vocabulary score based on word variety and length
   * @param {string} text - The text to analyze
   * @returns {number} - Score from 1-10
   */
  calculateVocabularyScore(text) {
    if (!text) return 5;
    
    const words = text.toLowerCase().split(/\s+/).filter(Boolean);
    if (words.length === 0) return 5;
    
    // Count unique words (lexical diversity)
    const uniqueWords = new Set(words);
    const lexicalDiversity = uniqueWords.size / words.length;
    
    // Calculate average word length
    const avgWordLength = words.join('').length / words.length;
    
    // Simple score based on these metrics
    // Lexical diversity of 0.6+ is quite good for academic writing
    // Average word length of 5+ characters suggests more sophisticated vocabulary
    let score = 5; // Base score
    
    if (lexicalDiversity > 0.7) score += 2;
    else if (lexicalDiversity > 0.5) score += 1;
    
    if (avgWordLength > 6) score += 2;
    else if (avgWordLength > 5) score += 1;
    
    // Cap score at 10
    return Math.min(10, score);
  }
}

export default new WritingAssessmentService(); 