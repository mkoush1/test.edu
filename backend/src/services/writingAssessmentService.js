// writingAssessmentService.js
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

/**
 * Service for evaluating writing assessments using AI
 */
class WritingAssessmentService {
  constructor() {
    // Use the provided OpenRouter API key or fall back to environment variable
    this.openRouterApiKey = process.env.OPENROUTER_API_KEY || "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";
    this.model = "meta-llama/llama-3.3-8b-instruct:free";
    
    // Flag to use mock responses as fallback when API fails
    this.useFallbackOnError = true;
    
    console.log("WritingAssessmentService initialized with model:", this.model);
  }

  /**
   * Evaluate a writing assessment based on the 5 academic criteria
   * @param {string} question - The question or prompt for the user
   * @param {string} answer - The user's written response
   * @returns {Promise<Object>} - Assessment results with scores for each criteria
   */
  async evaluateWriting(question, answer) {
    console.log("evaluateWriting called with:", { 
      questionLength: question?.length, 
      answerLength: answer?.length 
    });
    
    try {
      // If the answer is very short, provide simplified evaluation
      if (answer.length < 10) {
        console.log("Answer too short, providing simplified evaluation");
        return this.getSimplifiedAssessment(answer);
      }
      
      // Define the prompt for evaluating academic writing
      const prompt = `
You are a university-level writing assessment expert. Please evaluate the following writing sample in response to the given prompt. 
Rate each of the following 5 criteria on a scale of 1-10, where 1 is very poor and 10 is excellent:

1. Coherence and Clarity: Logical flow of ideas, clear connections between sentences and paragraphs, understandability.
2. Organization and Structure: Clear introduction, body, and conclusion, logical ordering of ideas, effective transitions.
3. Focus and Content Development: Addressing the prompt fully, staying on topic, developing ideas with specific details.
4. Vocabulary and Word Choice: Precision and appropriateness of vocabulary, lexical diversity and sophistication.
5. Grammar and Conventions: Correctness in grammar, spelling, punctuation, and other writing mechanics.

Prompt: "${question}"

Student Answer: "${answer}"

Please provide:
1. A numeric score (1-10) for each of the 5 criteria 
2. Brief comments on strengths and areas for improvement for each criteria
3. An overall percentage score out of 100
4. A few sentences of overall feedback
5. Three specific, actionable recommendations for how the student can improve their writing skills based on their performance
`;

      console.log("Preparing to send request to OpenRouter API");
      console.log("API Key (first 5 chars):", this.openRouterApiKey.substring(0, 5) + "...");
      
      // Make the request to OpenRouter API
      const requestConfig = {
        url: 'https://openrouter.ai/api/v1/chat/completions',
        method: 'post',
        data: {
          model: this.model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 800
        },
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openRouterApiKey}`,
          'HTTP-Referer': 'https://edusoft.com', 
          'X-Title': 'EduSoft Writing Assessment'
        },
        timeout: 30000 // 30 second timeout
      };
      
      console.log("Request configuration:", {
        url: requestConfig.url,
        method: requestConfig.method,
        model: requestConfig.data.model,
        headers: {
          ...requestConfig.headers,
          'Authorization': 'Bearer sk-****' // Masked for security
        }
      });
      
      console.log("Sending request to OpenRouter API...");
      const response = await axios(requestConfig);
      
      console.log("Response received from OpenRouter API:", {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        dataKeys: Object.keys(response.data || {}),
        hasChoices: response.data?.choices?.length > 0,
        firstChoiceContent: response.data?.choices?.[0]?.message?.content?.substring(0, 50) + "..."
      });

      // Parse the response to extract scores and feedback
      const aiResponse = response.data.choices[0].message.content;
      console.log("AI response content (first 100 chars):", aiResponse.substring(0, 100) + "...");
      
      // Parse the AI response to extract structured data
      console.log("Parsing AI response...");
      const parsedResult = this.parseAIResponse(aiResponse);
      console.log("Parsed result:", {
        criteriaCount: parsedResult.criteria.length,
        overallScore: parsedResult.overallScore,
        feedbackLength: parsedResult.overallFeedback.length
      });
      
      // Add metadata
      parsedResult.isAiGenerated = true;
      parsedResult.isMockData = false;
      parsedResult.aiModel = response.data.model || this.model;
      
      return parsedResult;
    } catch (error) {
      console.error('Error evaluating writing assessment:', {
        message: error.message,
        stack: error.stack,
        response: error.response ? {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        } : 'No response data',
        request: error.request ? 'Request was made but no response received' : 'No request was made'
      });
      
      // Use fallback assessment if enabled
      if (this.useFallbackOnError) {
        console.log("Using fallback assessment due to API error");
        return this.getDetailedMockAssessment(question, answer);
      }
      
      throw new Error(`Failed to evaluate writing assessment: ${error.message}`);
    }
  }

  /**
   * Generate a detailed mock assessment for longer answers
   * @param {string} question - The writing prompt
   * @param {string} answer - The student's answer
   * @returns {Object} - A mock assessment object
   */
  getDetailedMockAssessment(question, answer) {
    console.log("Generating detailed mock assessment");
    
    // Basic metrics for assessment
    const wordCount = (answer || '').split(/\s+/).filter(Boolean).length;
    const sentenceCount = (answer || '').split(/[.!?]+/).filter(Boolean).length;
    const avgSentenceLength = sentenceCount > 0 ? wordCount / sentenceCount : 0;
    const paragraphCount = (answer || '').split(/\n\s*\n/).filter(Boolean).length;
    
    // Apply penalties for minimal responses
    const isVeryMinimal = wordCount < 10;
    
    // Base scores adjusted by text metrics - scaled to 20 instead of 10
    let coherenceScore = Math.min(7, 2 + (paragraphCount > 1 ? 2 : 0) + (sentenceCount > 5 ? 2 : 0));
    let organizationScore = Math.min(7, 2 + (paragraphCount >= 3 ? 3 : paragraphCount));
    let focusScore = Math.min(7, 2 + Math.min(3, wordCount / 50));
    let vocabularyScore = Math.min(7, 2 + (avgSentenceLength > 8 ? 3 : 1) + this.calculateVocabularyVariety(answer));
    let grammarScore = Math.min(7, 3 + (sentenceCount > 5 ? 2 : 0));
    
    // Penalty for very minimal responses
    if (isVeryMinimal) {
      coherenceScore = Math.min(coherenceScore, 3);
      organizationScore = Math.min(organizationScore, 2);
      focusScore = Math.min(focusScore, 2);
      vocabularyScore = Math.min(vocabularyScore, 2);
      grammarScore = Math.min(grammarScore, 3);
    }
    
    // Scale scores from 0-10 to 0-20
    coherenceScore = coherenceScore * 2;
    organizationScore = organizationScore * 2;
    focusScore = focusScore * 2;
    vocabularyScore = vocabularyScore * 2;
    grammarScore = grammarScore * 2;
    
    // Calculate overall score (out of 100)
    const overallScore = Math.round((coherenceScore + organizationScore + focusScore + vocabularyScore + grammarScore));
    
    // Generate appropriate feedback
    const feedback = this.generateFeedback(wordCount, paragraphCount, overallScore);
    
    // Create assessment object
    return {
      criteria: [
        {
          name: 'Coherence and Clarity',
          score: coherenceScore,
          feedback: isVeryMinimal 
            ? 'The response is too brief to fully evaluate coherence. Consider developing your ideas more fully with clear connections between them.' 
            : coherenceScore > 10 
              ? 'Your ideas generally flow logically and are mostly clear to follow.' 
              : 'Work on creating clearer connections between your ideas and ensuring your writing flows logically.'
        },
        {
          name: 'Organization and Structure',
          score: organizationScore,
          feedback: isVeryMinimal 
            ? 'The response is too brief to demonstrate proper organization. A more developed structure with introduction, body, and conclusion is needed.' 
            : organizationScore > 10 
              ? 'Your writing shows decent organization with a recognizable structure.' 
              : 'Focus on creating a clearer structure with an introduction, well-developed body paragraphs, and a conclusion.'
        },
        {
          name: 'Focus and Content Development',
          score: focusScore,
          feedback: isVeryMinimal 
            ? 'The response lacks sufficient content to demonstrate focus on the topic. More development is needed to address the prompt fully.' 
            : focusScore > 10 
              ? 'You stay on topic and provide some relevant details to support your points.' 
              : 'Work on developing your ideas more fully with specific examples and details that address the prompt directly.'
        },
        {
          name: 'Vocabulary and Word Choice',
          score: vocabularyScore,
          feedback: isVeryMinimal 
            ? 'The response contains very limited vocabulary. Expand your word choices to demonstrate a broader lexical range.' 
            : vocabularyScore > 10 
              ? 'You use a reasonable range of vocabulary appropriate to the topic.' 
              : 'Try to use more precise and varied vocabulary to express your ideas more effectively.'
        },
        {
          name: 'Grammar and Conventions',
          score: grammarScore,
          feedback: isVeryMinimal 
            ? 'The limited text makes it difficult to fully assess grammar. Focus on writing complete, grammatically correct sentences.' 
            : grammarScore > 10 
              ? 'Your grammar is generally accurate with some minor errors that don\'t impede understanding.' 
              : 'Focus on improving your grammar accuracy, particularly with sentence structure and verb tenses.'
        }
      ],
      overallScore: overallScore,
      overallFeedback: feedback.overall,
      recommendations: feedback.recommendations,
      isAiGenerated: false,
      isMockData: true
    };
  }

  /**
   * Generate a simplified assessment for very short answers
   * @param {string} answer - The student's answer
   * @returns {Object} - A simplified assessment object
   */
  getSimplifiedAssessment(answer) {
    console.log("Generating simplified assessment for very short answer");
    
    // For extremely minimal responses - using scores out of 20 now
    return {
      criteria: [
        {
          name: 'Coherence and Clarity',
          score: 4,
          feedback: 'The response is too brief to evaluate coherence. A complete response with multiple sentences is required.'
        },
        {
          name: 'Organization and Structure',
          score: 4,
          feedback: 'The response is too brief to evaluate organization. A complete response with clear structure is required.'
        },
        {
          name: 'Focus and Content Development',
          score: 4,
          feedback: 'The response is too brief to evaluate focus. A complete response addressing the prompt is required.'
        },
        {
          name: 'Vocabulary and Word Choice',
          score: 4,
          feedback: 'The response is too brief to evaluate vocabulary. A complete response with varied vocabulary is required.'
        },
        {
          name: 'Grammar and Conventions',
          score: 6,
          feedback: 'The response is too brief to evaluate grammar. A complete response with proper grammar is required.'
        }
      ],
      overallScore: 22,
      overallFeedback: 'Your response is very brief, which makes it difficult to fully assess your writing skills. To demonstrate your abilities, aim to write more developed responses with clear organization and detailed content.',
      recommendations: [
        'Write responses that are at least several paragraphs long to demonstrate your writing ability.',
        'Make sure to address all aspects of the prompt in your response.',
        'Practice developing your ideas with specific examples and details.'
      ],
      isAiGenerated: false,
      isMockData: true
    };
  }

  /**
   * Generate feedback and recommendations based on writing metrics
   * @param {number} wordCount - Number of words in the response
   * @param {number} paragraphCount - Number of paragraphs
   * @param {number} overallScore - The calculated overall score
   * @returns {Object} - Feedback and recommendations
   */
  generateFeedback(wordCount, paragraphCount, overallScore) {
    let overall = '';
    let recommendations = [];
    
    if (wordCount < 50) {
      overall = 'Your response is very brief, which makes it difficult to fully assess your writing skills. To demonstrate your abilities, aim to write more developed responses with clear organization and detailed content.';
      recommendations = [
        'Aim to write longer responses with multiple paragraphs to fully address the prompt.',
        'Include an introduction, body paragraphs, and conclusion in your writing.',
        'Develop your ideas with specific examples and supporting details.'
      ];
    } else if (overallScore < 40) {
      overall = 'Your writing shows developing skills but needs significant improvement in multiple areas. Focus on building fundamental writing skills including organization, clarity, and grammar.';
      recommendations = [
        'Practice writing complete sentences with correct grammar and punctuation.',
        'Organize your ideas into clear paragraphs with topic sentences.',
        'Work on using transition words to connect your ideas more clearly.',
        'Read regularly to improve your vocabulary and understanding of writing structures.'
      ];
    } else if (overallScore < 60) {
      overall = 'Your writing demonstrates basic competence but would benefit from further development in several areas. With practice, you can improve the organization, clarity, and depth of your writing.';
      recommendations = [
        'Develop your ideas more fully with specific examples and details.',
        'Work on creating clearer transitions between sentences and paragraphs.',
        'Expand your vocabulary to express ideas more precisely.',
        'Review basic grammar rules, particularly sentence structure and verb tenses.'
      ];
    } else if (overallScore < 80) {
      overall = 'Your writing shows good competence with clear strengths in several areas. Continue developing your skills to achieve more sophisticated and polished writing.';
      recommendations = [
        'Practice creating more complex sentence structures while maintaining clarity.',
        'Work on developing more nuanced arguments with stronger evidence.',
        'Expand your vocabulary with more precise and sophisticated word choices.',
        'Focus on creating smoother transitions between ideas and paragraphs.'
      ];
    } else {
      overall = 'Your writing demonstrates strong skills across multiple criteria. Your ideas are generally well-organized, clearly expressed, and supported with appropriate details.';
      recommendations = [
        'Continue refining your ability to create sophisticated and nuanced arguments.',
        'Work on incorporating more varied sentence structures for stylistic effect.',
        'Develop an even more precise and varied vocabulary appropriate to academic writing.',
        'Practice editing your work to eliminate minor grammatical or stylistic issues.'
      ];
    }
    
    return {
      overall: overall,
      recommendations: recommendations
    };
  }

  /**
   * Calculate vocabulary variety score based on lexical diversity
   * @param {string} text - The text to analyze
   * @returns {number} - Score from 0-3
   */
  calculateVocabularyVariety(text) {
    if (!text) return 0;
    
    const words = text.toLowerCase().split(/\s+/).filter(Boolean);
    if (words.length < 10) return 0;
    
    // Count unique words (lexical diversity)
    const uniqueWords = new Set(words);
    const lexicalDiversity = uniqueWords.size / words.length;
    
    // Calculate average word length
    const avgWordLength = words.join('').length / words.length;
    
    // Simple score based on these metrics
    let score = 0;
    
    if (lexicalDiversity > 0.7) score += 2;
    else if (lexicalDiversity > 0.5) score += 1;
    
    if (avgWordLength > 6) score += 1;
    
    return score;
  }

  /**
   * Parse the AI response to extract structured data
   * @param {string} aiResponse - The raw response from OpenAI
   * @returns {Object} - Structured assessment data
   */
  parseAIResponse(aiResponse) {
    try {
      console.log("Starting to parse AI response...");
      
      // Initialize scores object
      const assessment = {
        criteria: [
          { name: 'Coherence and Clarity', score: 0, feedback: '' },
          { name: 'Organization and Structure', score: 0, feedback: '' },
          { name: 'Focus and Content Development', score: 0, feedback: '' },
          { name: 'Vocabulary and Word Choice', score: 0, feedback: '' },
          { name: 'Grammar and Conventions', score: 0, feedback: '' }
        ],
        overallScore: 0,
        overallFeedback: '',
        recommendations: []
      };

      // Find criteria scores using regex
      const coherenceMatch = aiResponse.match(/Coherence and Clarity:?\s*(\d+)/i);
      const organizationMatch = aiResponse.match(/Organization and Structure:?\s*(\d+)/i);
      const focusMatch = aiResponse.match(/Focus and Content Development:?\s*(\d+)/i);
      const vocabularyMatch = aiResponse.match(/Vocabulary and Word Choice:?\s*(\d+)/i);
      const grammarMatch = aiResponse.match(/Grammar and Conventions:?\s*(\d+)/i);
      
      console.log("Regex matches:", {
        coherenceMatch: coherenceMatch ? coherenceMatch[1] : null,
        organizationMatch: organizationMatch ? organizationMatch[1] : null,
        focusMatch: focusMatch ? focusMatch[1] : null,
        vocabularyMatch: vocabularyMatch ? vocabularyMatch[1] : null,
        grammarMatch: grammarMatch ? grammarMatch[1] : null
      });
      
      // Extract overall score percentage
      const overallMatch = aiResponse.match(/overall percentage score:?\s*(\d+)/i) || 
                         aiResponse.match(/overall score:?\s*(\d+)/i) ||
                         aiResponse.match(/(\d+)%/);
      
      console.log("Overall score match:", overallMatch ? overallMatch[1] : null);

      // Find feedback sections
      const sections = aiResponse.split(/\d+\.\s+/);
      console.log("Split sections count:", sections.length);
      
      // Extract feedback for each criterion and overall feedback
      if (coherenceMatch) assessment.criteria[0].score = parseInt(coherenceMatch[1]);
      if (organizationMatch) assessment.criteria[1].score = parseInt(organizationMatch[1]);
      if (focusMatch) assessment.criteria[2].score = parseInt(focusMatch[1]);
      if (vocabularyMatch) assessment.criteria[3].score = parseInt(vocabularyMatch[1]);
      if (grammarMatch) assessment.criteria[4].score = parseInt(grammarMatch[1]);
      
      // Extract feedback sections
      for (let i = 1; i <= 5; i++) {
        if (sections[i]) {
          const feedbackText = sections[i].trim();
          console.log(`Processing section ${i}, length: ${feedbackText.length}`);
          
          const feedbackMatch = feedbackText.match(/^([^:]+):\s*([\s\S]+?)(?=\n\n|\n\d+\.|\n$|$)/);
          if (feedbackMatch && feedbackMatch[2]) {
            assessment.criteria[i-1].feedback = feedbackMatch[2].trim();
            console.log(`Found feedback for criterion ${i}, length: ${assessment.criteria[i-1].feedback.length}`);
          } else {
            console.log(`No feedback match found for section ${i}`);
          }
        } else {
          console.log(`Section ${i} not found`);
        }
      }
      
      // Scale scores from 0-10 to 0-20 for display in frontend
      assessment.criteria.forEach(criterion => {
        if (criterion.score > 0 && criterion.score <= 10) {
          criterion.score = criterion.score * 2;
        }
      });
      
      // Compute overall score if not provided
      if (overallMatch) {
        assessment.overallScore = parseInt(overallMatch[1]);
        console.log("Using matched overall score:", assessment.overallScore);
      } else {
        // Calculate as sum of criteria scores
        const sum = assessment.criteria.reduce((acc, criterion) => acc + criterion.score, 0);
        assessment.overallScore = sum; // Total score out of 100
        console.log("Calculated overall score:", assessment.overallScore);
      }
      
      // Extract overall feedback
      const overallFeedbackMatch = aiResponse.match(/overall feedback:?\s*([\s\S]+?)(?=recommendations|$)/i);
      if (overallFeedbackMatch) {
        assessment.overallFeedback = overallFeedbackMatch[1].trim();
        console.log("Found overall feedback, length:", assessment.overallFeedback.length);
      } else {
        console.log("No overall feedback match found");
        assessment.overallFeedback = "The writing demonstrates various strengths and weaknesses across the evaluated criteria. Continue practicing to improve your writing skills.";
      }
      
      // Extract recommendations - improved pattern matching
      const recommendationsMatch = aiResponse.match(/recommendations:?(?:\s*for\s*improvement)?:?\s*([\s\S]+?)(?=\n\n\d+\.|\n\n[A-Z]|$)/i) || 
                                aiResponse.match(/recommendations:?\s*([\s\S]+?)$/i);
                                
      if (recommendationsMatch) {
        const recommendationsText = recommendationsMatch[1].trim();
        console.log("Found recommendations, length:", recommendationsText.length);
        
        // Try to extract numbered recommendations
        const numberedRecommendations = recommendationsText.match(/\d+\.\s*(.*?)(?=\n\d+\.|$)/gs);
        if (numberedRecommendations && numberedRecommendations.length > 0) {
          assessment.recommendations = numberedRecommendations.map(rec => rec.replace(/^\d+\.\s*/, '').trim());
        } else {
          // If no numbered format, try to split by lines or sentences
          const lines = recommendationsText.split(/\n/).filter(line => line.trim().length > 0);
          if (lines.length > 1) {
            assessment.recommendations = lines;
          } else {
            // Split by sentences if it's just one big paragraph
            const sentences = recommendationsText.match(/[^.!?]+[.!?]+/g);
            if (sentences && sentences.length > 0) {
              assessment.recommendations = sentences.map(s => s.trim());
            } else {
              assessment.recommendations = [recommendationsText];
            }
          }
        }
        
        console.log("Extracted recommendations count:", assessment.recommendations.length);
      } else {
        console.log("No recommendations match found, using defaults");
        assessment.recommendations = [
          "Practice organizing your ideas with clear introduction, body, and conclusion.",
          "Work on connecting your ideas with appropriate transition words.",
          "Expand your vocabulary by reading widely in your target language."
        ];
      }
      
      // Final validation to ensure all criteria have valid scores
      assessment.criteria.forEach((criterion, index) => {
        if (!criterion.score || criterion.score < 0 || criterion.score > 20) {
          console.log(`Invalid score for criterion ${index}, using default`);
          criterion.score = 10; // Default to middle score if invalid
        }
        if (!criterion.feedback || criterion.feedback.length < 5) {
          console.log(`Invalid feedback for criterion ${index}, using default`);
          criterion.feedback = "This area shows both strengths and areas for improvement.";
        }
      });
      
      // Ensure overall score is valid
      if (!assessment.overallScore || assessment.overallScore < 0 || assessment.overallScore > 100) {
        console.log("Invalid overall score, recalculating");
        const sum = assessment.criteria.reduce((acc, criterion) => acc + criterion.score, 0);
        assessment.overallScore = sum; // Sum of all criteria scores
      }
      
      return assessment;
    } catch (error) {
      console.error("Error parsing AI response:", error);
      console.error("Raw AI response:", aiResponse);
      
      // If parsing fails, return a simplified assessment
      return this.getDetailedMockAssessment("", "Error parsing AI response");
    }
  }

  /**
   * Generate a new writing prompt based on the level and language
   * @param {string} level - CEFR level (a1, a2, b1, b2, c1, c2)
   * @param {string} language - Language (english, french)
   * @returns {Promise<Object>} - Generated prompt with title, instructions, time limit, word limit, and criteria
   */
  async generateWritingPrompt(level, language) {
    console.log(`Generating writing prompt for level: ${level}, language: ${language}`);
    
    try {
      // Define the prompt for generating a writing assessment task
      const prompt = `
You are an expert language assessment designer specializing in CEFR (Common European Framework of Reference) standards.

Please create a writing assessment prompt for a ${language} language learner at CEFR level ${level.toUpperCase()}.

The prompt should include:
1. A clear title for the writing task
2. Detailed instructions that are appropriate for the ${level.toUpperCase()} level
3. A recommended time limit in minutes
4. A target word count appropriate for the level
5. A list of 3-5 assessment criteria specific to this task

Make sure the task is:
- Aligned with ${level.toUpperCase()} CEFR standards
- Culturally appropriate and inclusive
- Clear and unambiguous
- Engaging and relevant to adult learners
- Designed to elicit language appropriate to the ${level.toUpperCase()} level

Format your response as a JSON object with these fields:
{
  "title": "Task title",
  "prompt": "Detailed instructions for the student",
  "timeLimit": number of minutes recommended,
  "wordLimit": target word count,
  "criteria": ["criterion 1", "criterion 2", "criterion 3", ...]
}

Do not include any explanations or notes outside the JSON structure.
`;

      console.log("Preparing to send request to OpenRouter API for prompt generation");
      
      // Make the request to OpenRouter API
      const requestConfig = {
        url: 'https://openrouter.ai/api/v1/chat/completions',
        method: 'post',
        data: {
          model: this.model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.8,
          max_tokens: 800
        },
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openRouterApiKey}`,
          'HTTP-Referer': 'https://edusoft.com', 
          'X-Title': 'EduSoft Writing Prompt Generator'
        },
        timeout: 30000 // 30 second timeout
      };
      
      console.log("Sending request to OpenRouter API for prompt generation...");
      const response = await axios(requestConfig);
      
      console.log("Response received from OpenRouter API:", {
        status: response.status,
        statusText: response.statusText,
        dataKeys: Object.keys(response.data || {}),
        hasChoices: response.data?.choices?.length > 0,
        firstChoiceContent: response.data?.choices?.[0]?.message?.content?.substring(0, 50) + "..."
      });

      // Parse the response to extract the prompt
      const aiResponse = response.data.choices[0].message.content;
      console.log("AI response content (first 100 chars):", aiResponse.substring(0, 100) + "...");
      
      // Parse the JSON response
      let promptData;
      try {
        // First try to extract JSON if it's wrapped in markdown code blocks
        const jsonMatch = aiResponse.match(/```(?:json)?\s*({[\s\S]*?})\s*```/) || 
                         aiResponse.match(/({[\s\S]*})/) ||
                         aiResponse.match(/{[\s\S]*?}/);
                         
        const jsonString = jsonMatch ? jsonMatch[1] : aiResponse;
        
        promptData = JSON.parse(jsonString);
        console.log("Successfully parsed JSON response:", {
          title: promptData.title,
          promptLength: promptData.prompt?.length || 0,
          timeLimit: promptData.timeLimit,
          wordLimit: promptData.wordLimit,
          criteriaCount: promptData.criteria?.length || 0
        });
      } catch (parseError) {
        console.error("Error parsing JSON response:", parseError);
        console.log("Raw response:", aiResponse);
        throw new Error("Failed to parse AI response as JSON");
      }
      
      // Validate the prompt data
      if (!promptData.title || !promptData.prompt || !promptData.timeLimit || !promptData.wordLimit || !promptData.criteria) {
        console.error("Invalid prompt data:", promptData);
        throw new Error("AI generated an invalid prompt format");
      }
      
      return promptData;
    } catch (error) {
      console.error('Error generating writing prompt:', {
        message: error.message,
        stack: error.stack,
        response: error.response ? {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        } : 'No response data'
      });
      
      // Use fallback prompt if API fails
      console.log("Using fallback prompt due to API error");
      return this.getFallbackPrompt(level, language);
    }
  }

  /**
   * Get a fallback writing prompt when API call fails
   * @param {string} level - CEFR level
   * @param {string} language - Language
   * @returns {Object} - Default prompt
   */
  getFallbackPrompt(level, language) {
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
}

export default new WritingAssessmentService(); 