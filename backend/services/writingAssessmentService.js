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
    this.openRouterApiKey = "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";
    this.model = "meta-llama/llama-3.3-8b-instruct:free";
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
        }
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
      
      throw new Error(`Failed to evaluate writing assessment: ${error.message}`);
    }
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
        recommendations: [],
        isAiGenerated: false,
        aiModel: this.model
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
      
      // Compute overall score if not provided
      if (overallMatch) {
        assessment.overallScore = parseInt(overallMatch[1]);
        console.log("Using matched overall score:", assessment.overallScore);
      } else {
        // Calculate average if not provided
        const sum = assessment.criteria.reduce((acc, criterion) => acc + criterion.score, 0);
        assessment.overallScore = Math.round((sum / 5) * 10); // Convert to percentage
        console.log("Calculated overall score:", assessment.overallScore);
      }
      
      // Ensure score consistency - this is the key change to fix the score discrepancy
      // Store the raw score calculation for reference
      assessment.rawScoreCalculation = assessment.criteria.reduce((acc, criterion) => acc + criterion.score, 0);
      
      // Recalculate overall score based on criteria scores to ensure consistency
      // Each criterion is out of 10, so total is out of 50, convert to percentage
      const calculatedScore = Math.round((assessment.rawScoreCalculation / 50) * 100);
      
      // Always use the calculated score for consistency
      assessment.overallScore = calculatedScore;
      console.log("Using calculated score for consistency:", assessment.overallScore);
      
      // Calculate original score for debugging
      if (overallMatch) {
        const originalScore = parseInt(overallMatch[1]);
        if (originalScore !== calculatedScore) {
          console.log(`Score discrepancy detected: AI gave ${originalScore}%, calculation gives ${calculatedScore}%`);
        }
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
          assessment.isAiGenerated = true; // Flag that these are AI-generated recommendations
        } else {
          // If no numbered format, try to split by lines or sentences
          const lines = recommendationsText.split(/\n/).filter(line => line.trim().length > 0);
          if (lines.length > 1) {
            assessment.recommendations = lines;
            assessment.isAiGenerated = true; // Flag that these are AI-generated recommendations
          } else {
            // Split by sentences if it's just one big paragraph
            const sentences = recommendationsText.match(/[^.!?]+[.!?]+/g);
            if (sentences && sentences.length > 0) {
              assessment.recommendations = sentences.map(s => s.trim());
              assessment.isAiGenerated = true; // Flag that these are AI-generated recommendations
            } else {
              assessment.recommendations = [recommendationsText];
              assessment.isAiGenerated = true; // Flag that these are AI-generated recommendations
            }
          }
        }
        
        console.log("Extracted recommendations count:", assessment.recommendations.length);
        console.log("Recommendations are AI-generated:", assessment.isAiGenerated);
      } else {
        console.log("No recommendations match found, providing level-appropriate recommendations");
        assessment.isAiGenerated = false; // Flag that these are fallback recommendations
        
        // Provide appropriate recommendations based on the overall score
        if (assessment.overallScore < 20) {
          assessment.recommendations = [
            "Start with basic sentence structure practice: subject + verb + object.",
            "Learn and practice using common vocabulary words in simple sentences.",
            "Focus on writing short, clear sentences before attempting paragraphs.",
            "Practice identifying and correcting basic grammar errors.",
            "Consider working with a tutor or taking a foundational writing course."
          ];
        } else if (assessment.overallScore < 40) {
          assessment.recommendations = [
            "Practice writing simple paragraphs with a clear topic sentence.",
            "Work on connecting sentences with basic transition words.",
            "Expand your vocabulary by reading texts at your level.",
            "Practice identifying and correcting common grammar errors.",
            "Try summarizing short articles to improve comprehension and writing skills."
          ];
        } else if (assessment.overallScore < 60) {
          assessment.recommendations = [
            "Focus on organizing your writing with clear introduction, body, and conclusion.",
            "Practice developing your ideas with supporting details and examples.",
            "Work on using a wider range of vocabulary appropriate to the topic.",
            "Review and practice more complex grammar structures.",
            "Analyze model essays to understand effective writing techniques."
          ];
        } else if (assessment.overallScore < 80) {
          assessment.recommendations = [
            "Work on creating more sophisticated paragraph structures with clear transitions.",
            "Practice incorporating more nuanced vocabulary to express complex ideas.",
            "Focus on developing more compelling arguments with stronger evidence.",
            "Review advanced grammar structures to eliminate recurring errors.",
            "Practice writing in different academic styles appropriate to your field."
          ];
        } else {
          assessment.recommendations = [
            "Focus on refining your academic voice to achieve greater precision and impact.",
            "Work on incorporating more sophisticated rhetorical techniques in your writing.",
            "Practice writing more concise sentences without losing meaning or clarity.",
            "Develop more nuanced arguments that acknowledge counterpoints.",
            "Study advanced stylistic techniques used in published academic papers in your field."
          ];
        }
      }
      
      // Ensure we always have at least 3 recommendations
      if (assessment.recommendations.length < 3) {
        const additionalRecs = [
          "Read extensively in your field to improve your understanding of academic writing conventions.",
          "Practice writing regularly to develop your skills and build confidence.",
          "Seek feedback from peers or instructors to identify areas for improvement."
        ];
        
        for (let i = 0; i < additionalRecs.length && assessment.recommendations.length < 3; i++) {
          assessment.recommendations.push(additionalRecs[i]);
        }
      }
      
      console.log("Parsing complete, returning assessment object");
      return assessment;
    } catch (error) {
      console.error('Error parsing AI response:', {
        message: error.message,
        stack: error.stack,
        aiResponsePreview: aiResponse ? aiResponse.substring(0, 200) + "..." : "No AI response"
      });
      throw new Error('Failed to parse AI assessment response');
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

Your response should be structured as follows:
1. A title for the writing task (brief and clear)
2. A detailed prompt/instructions for the student (what they should write about)
3. Appropriate time limit in minutes for this level (${this.getDefaultTimeLimit(level)} minutes is typical for ${level.toUpperCase()})
4. Recommended word count target as a single number (${this.getDefaultWordLimit(level)} words is typical for ${level.toUpperCase()})
5. 3-5 specific assessment criteria that are appropriate for this CEFR level

IMPORTANT: For wordLimit, provide a single integer number, not a range.

Make the topic interesting, relevant to adult learners, and appropriate for the specified CEFR level. 
Ensure the complexity of vocabulary, grammar, and task matches the CEFR level requirements.
DO NOT use generic topics like "write about your family" or "describe your hobby" - be specific and creative.

For reference:
- A1: Can write simple phrases and sentences about themselves and imaginary people.
- A2: Can write a series of simple phrases and sentences linked with simple connectors.
- B1: Can write straightforward connected texts on familiar subjects.
- B2: Can write clear, detailed texts on various subjects related to their field of interest.
- C1: Can write clear, well-structured texts on complex subjects.
- C2: Can write complex texts with clarity and fluency in an appropriate and effective style.

Return the response in JSON format with these fields: title, prompt, timeLimit (in minutes), wordLimit (as a single integer), and criteria (array).
`;

      console.log("Preparing to send request to OpenRouter API for prompt generation");
      
      // Make the request to OpenRouter API with increased timeout
      const requestConfig = {
        url: 'https://openrouter.ai/api/v1/chat/completions',
        method: 'post',
        data: {
          model: this.model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.8,
          max_tokens: 600,
          response_format: { type: "json_object" }
        },
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openRouterApiKey}`,
          'HTTP-Referer': 'https://edusoft.com', 
          'X-Title': 'EduSoft Writing Assessment Generator'
        },
        timeout: 20000 // Increase timeout to 20 seconds
      };
      
      console.log("Sending request to OpenRouter API for prompt generation...");
      const response = await axios(requestConfig);
      
      console.log("Response received from OpenRouter API:", {
        status: response.status,
        statusText: response.statusText,
        dataKeys: Object.keys(response.data || {}),
        hasChoices: response.data?.choices?.length > 0,
        firstChoiceContent: response.data?.choices?.[0]?.message?.content?.substring(0, 100) + "..."
      });

      // Parse the response to extract the generated prompt
      const aiResponse = response.data.choices[0].message.content;
      console.log("AI response content (first 100 chars):", aiResponse.substring(0, 100) + "...");
      
      try {
        // Try to parse the JSON response
        let promptData;
        
        try {
          // First attempt: direct JSON parsing
          promptData = JSON.parse(aiResponse);
        } catch (parseError) {
          console.error("Error parsing AI response as JSON:", parseError);
          console.log("Raw response:", aiResponse);
          
          // Second attempt: try to fix common JSON issues
          let fixedJson = aiResponse;
          
          // Fix ranges like "250-300" to just use the upper bound
          fixedJson = fixedJson.replace(/"wordLimit"\s*:\s*"?(\d+)-(\d+)"?/g, '"wordLimit": $2');
          fixedJson = fixedJson.replace(/"wordLimit"\s*:\s*"(\d+)"/g, '"wordLimit": $1');
          
          // Fix quotes around numbers
          fixedJson = fixedJson.replace(/"timeLimit"\s*:\s*"(\d+)"/g, '"timeLimit": $1');
          
          // Try parsing again with fixed JSON
          try {
            console.log("Attempting to parse fixed JSON:", fixedJson.substring(0, 100) + "...");
            promptData = JSON.parse(fixedJson);
          } catch (secondError) {
            console.error("Still failed to parse JSON after fixes:", secondError);
            // Extract JSON by finding opening and closing braces
            const jsonMatch = aiResponse.match(/(\{[\s\S]*\})/);
            if (jsonMatch && jsonMatch[1]) {
              try {
                console.log("Attempting to extract JSON from response");
                promptData = JSON.parse(jsonMatch[1]);
              } catch (thirdError) {
                console.error("Failed to extract JSON:", thirdError);
                throw new Error('Failed to parse AI response as JSON');
              }
            } else {
              throw new Error('Failed to parse AI response as JSON');
            }
          }
        }
        
        console.log("Successfully parsed JSON response:", {
          title: promptData.title,
          promptLength: promptData.prompt?.length || 0,
          timeLimit: promptData.timeLimit,
          wordLimit: promptData.wordLimit,
          criteriaCount: promptData.criteria?.length || 0
        });
        
        // Ensure all required fields are present and valid
        const validatedPrompt = {
          title: promptData.title || `${level.toUpperCase()} Writing Assessment`,
          prompt: promptData.prompt || "Write about a topic of your choice.",
          timeLimit: parseInt(promptData.timeLimit) || this.getDefaultTimeLimit(level),
          wordLimit: parseInt(promptData.wordLimit) || this.getDefaultWordLimit(level),
          criteria: Array.isArray(promptData.criteria) ? promptData.criteria : this.getDefaultCriteria(level, language)
        };
        
        console.log("Prompt generated successfully:", {
          title: validatedPrompt.title,
          promptLength: validatedPrompt.prompt.length,
          timeLimit: validatedPrompt.timeLimit,
          wordLimit: validatedPrompt.wordLimit,
          criteriaCount: validatedPrompt.criteria.length
        });
        
        return validatedPrompt;
      } catch (parseError) {
        console.error("Error parsing AI response:", parseError, "Raw response:", aiResponse);
        throw new Error('Failed to parse AI response as JSON');
      }
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
      
      // Don't fall back to default prompt, instead throw the error
      // to let the controller handle it
      throw error;
    }
  }

  /**
   * Get default time limit based on CEFR level
   * @param {string} level - CEFR level
   * @returns {number} - Time limit in minutes
   */
  getDefaultTimeLimit(level) {
    const timeLimits = {
      'a1': 10,
      'a2': 15,
      'b1': 20,
      'b2': 30,
      'c1': 40,
      'c2': 50
    };
    return timeLimits[level.toLowerCase()] || 20;
  }

  /**
   * Get default word limit based on CEFR level
   * @param {string} level - CEFR level
   * @returns {number} - Word limit
   */
  getDefaultWordLimit(level) {
    const wordLimits = {
      'a1': 50,
      'a2': 80,
      'b1': 150,
      'b2': 200,
      'c1': 300,
      'c2': 400
    };
    return wordLimits[level.toLowerCase()] || 150;
  }

  /**
   * Get default assessment criteria based on CEFR level and language
   * @param {string} level - CEFR level
   * @param {string} language - Language
   * @returns {Array} - Default criteria
   */
  getDefaultCriteria(level, language) {
    const isEnglish = language.toLowerCase() === 'english';
    
    const basicCriteria = [
      isEnglish ? 'Basic Vocabulary' : 'Vocabulaire de Base',
      isEnglish ? 'Simple Sentences' : 'Phrases Simples',
      isEnglish ? 'Personal Information' : 'Informations Personnelles'
    ];
    
    const intermediateCriteria = [
      isEnglish ? 'Vocabulary Range' : 'Étendue du Vocabulaire',
      isEnglish ? 'Grammar Accuracy' : 'Précision Grammaticale',
      isEnglish ? 'Text Organization' : 'Organisation du Texte',
      isEnglish ? 'Task Completion' : 'Réalisation de la Tâche'
    ];
    
    const advancedCriteria = [
      isEnglish ? 'Advanced Vocabulary' : 'Vocabulaire Avancé',
      isEnglish ? 'Complex Structures' : 'Structures Complexes',
      isEnglish ? 'Coherence and Cohesion' : 'Cohérence et Cohésion',
      isEnglish ? 'Critical Thinking' : 'Pensée Critique',
      isEnglish ? 'Academic Register' : 'Registre Académique'
    ];
    
    const levelLower = level.toLowerCase();
    if (levelLower === 'a1' || levelLower === 'a2') {
      return basicCriteria;
    } else if (levelLower === 'b1' || levelLower === 'b2') {
      return intermediateCriteria;
    } else {
      return advancedCriteria;
    }
  }

  /**
   * Get a default writing prompt when AI generation fails
   * @param {string} level - CEFR level
   * @param {string} language - Language
   * @returns {Object} - Default prompt
   */
  getDefaultPrompt(level, language) {
    const isEnglish = language.toLowerCase() === 'english';
    const levelLower = level.toLowerCase();
    
    let title, prompt, timeLimit, wordLimit, criteria;
    
    if (levelLower === 'a1') {
      title = isEnglish ? 'Simple Introduction' : 'Présentation Simple';
      prompt = isEnglish ? 
        'Write a short paragraph about yourself (name, age, nationality, job/studies, hobbies).' : 
        'Écrivez un court paragraphe sur vous-même (nom, âge, nationalité, travail/études, loisirs).';
      timeLimit = 10;
      wordLimit = 50;
      criteria = this.getDefaultCriteria('a1', language);
    } else if (levelLower === 'a2') {
      title = isEnglish ? 'My Daily Routine' : 'Ma Routine Quotidienne';
      prompt = isEnglish ? 
        'Describe your typical day. What do you do in the morning, afternoon, and evening?' : 
        'Décrivez votre journée typique. Que faites-vous le matin, l\'après-midi et le soir?';
      timeLimit = 15;
      wordLimit = 80;
      criteria = this.getDefaultCriteria('a2', language);
    } else if (levelLower === 'b1') {
      title = isEnglish ? 'Personal Experience' : 'Expérience Personnelle';
      prompt = isEnglish ? 
        'Write about a memorable trip or vacation you have taken. Describe where you went, who you were with, what you did, and why it was memorable.' : 
        'Écrivez à propos d\'un voyage ou de vacances mémorables que vous avez fait. Décrivez où vous êtes allé, avec qui vous étiez, ce que vous avez fait et pourquoi c\'était mémorable.';
      timeLimit = 20;
      wordLimit = 150;
      criteria = this.getDefaultCriteria('b1', language);
    } else if (levelLower === 'b2') {
      title = isEnglish ? 'Advantages and Disadvantages' : 'Avantages et Inconvénients';
      prompt = isEnglish ? 
        'Discuss the advantages and disadvantages of working from home. Give specific examples and your own opinion.' : 
        'Discutez des avantages et des inconvénients du télétravail. Donnez des exemples spécifiques et votre propre opinion.';
      timeLimit = 30;
      wordLimit = 200;
      criteria = this.getDefaultCriteria('b2', language);
    } else if (levelLower === 'c1') {
      title = isEnglish ? 'Argumentative Essay' : 'Essai Argumentatif';
      prompt = isEnglish ? 
        'Write an essay discussing whether social media has had a positive or negative impact on society. Present arguments for both sides and state your own opinion with supporting reasons.' : 
        'Rédigez un essai discutant si les médias sociaux ont eu un impact positif ou négatif sur la société. Présentez des arguments pour les deux côtés et donnez votre propre opinion avec des raisons à l\'appui.';
      timeLimit = 40;
      wordLimit = 300;
      criteria = this.getDefaultCriteria('c1', language);
    } else {
      title = isEnglish ? 'Critical Analysis' : 'Analyse Critique';
      prompt = isEnglish ? 
        'Analyze the relationship between technology and human communication. Discuss how digital tools have transformed interpersonal relationships, considering both benefits and challenges. Support your analysis with examples and scholarly perspectives.' : 
        'Analysez la relation entre la technologie et la communication humaine. Discutez comment les outils numériques ont transformé les relations interpersonnelles, en considérant à la fois les avantages et les défis. Soutenez votre analyse avec des exemples et des perspectives académiques.';
      timeLimit = 50;
      wordLimit = 400;
      criteria = this.getDefaultCriteria('c2', language);
    }
    
    return {
      title,
      prompt,
      timeLimit,
      wordLimit,
      criteria
    };
  }
}

export default new WritingAssessmentService(); 