import ReadingAssessment from '../models/ReadingAssessment.js';

/**
 * Service for handling reading assessment data and operations
 */
class ReadingAssessmentService {
  /**
   * Get reading assessment data for a specific level and language
   * @param {String} level - CEFR level
   * @param {String} language - Language
   * @returns {Promise<Object>} - Assessment data
   */
  async getAssessmentData(level, language) {
    try {
      return this.getStaticAssessmentData(level, language);
    } catch (error) {
      console.error('Error getting reading assessment data:', error);
      throw error;
    }
  }

  /**
   * Get static reading assessment data based on CEFR level and language
   * @param {String} level - CEFR level
   * @param {String} language - Language
   * @returns {Object} - Assessment data
   */
  getStaticAssessmentData(level, language = 'english') {
    // Normalize level to lowercase
    const normalizedLevel = level.toLowerCase();
    
    // Default text for when no reading text is available
    const defaultData = {
      title: 'Reading Assessment',
      text: 'Reading assessment content is being prepared for this level.',
      multipleChoiceQuestions: [],
      trueFalseQuestions: [],
      fillBlanksQuestions: {},
      categorizationQuestions: {}
    };
    
    // Define reading assessment data for each level
    const assessmentData = {
      a1: {
        title: 'Text messages to a friend',
        text: `Hi Aziz! Are you there?\nHello? Hello?!?\nHi! I'm here! I'm here.\nGood. 🙂🙂\nWhat's up, Neira?\nWould you like to meet for a coffee?\nYes! When?\nI'm working now, but I finish work at five. Maybe at 5.15?\nThat's difficult for me. Can we meet 30 minutes later?\nOK. Where?\nThe Blue Café is nice. I love the tea there. ♥\nIt's closed on Mondays. Let's go to Rocket Boy. It's new.\nIs it good?\nIt's very good!\nWhere is it? I don't know it.\nIt's next to the school. See you there?\nSee you there at 5.45!`,
        multipleChoiceQuestions: [
          {
            question: "What does Neira want to do?",
            options: ["Go to a café", "Go to a cinema", "Go to a class"],
            correctAnswer: 0
          },
          {
            question: "What time does Neira finish work?",
            options: ["Five o'clock", "A quarter past five", "A quarter to five"],
            correctAnswer: 0
          },
          {
            question: "What time does Aziz want to meet?",
            options: ["Five o'clock", "Five fifteen", "Five forty-five"],
            correctAnswer: 2
          },
          {
            question: "Why does Aziz like The Blue Café?",
            options: ["It's new.", "It's got nice tea.", "It's got nice coffee."],
            correctAnswer: 1
          },
          {
            question: "What is the problem with The Blue Café?",
            options: ["It's closed on Mondays.", "It hasn't got any tea.", "There is no problem."],
            correctAnswer: 0
          },
          {
            question: "Where are they going to meet?",
            options: ["The Blue Café", "Rocket Boy", "The school"],
            correctAnswer: 1
          }
        ],
        trueFalseQuestions: [
          {
            statement: "Aziz writes to Neira first.",
            isTrue: false
          },
          {
            statement: "Neira is at work.",
            isTrue: true
          },
          {
            statement: "Neira can meet at 5.45.",
            isTrue: true
          },
          {
            statement: "The Blue Café is closed on Mondays.",
            isTrue: true
          },
          {
            statement: "Aziz knows Rocket Boy.",
            isTrue: false
          },
          {
            statement: "They are going to meet at 6.15.",
            isTrue: false
          }
        ]
      },
      a2: {
        title: 'An airport notice',
        text: `What can I take on the plane as hand luggage?
Please note that passengers can only take ONE suitcase onto the plane. It must be no bigger
than 55cm x 22cm x 35cm and weigh no more than 10kg.
You can also take one small laptop bag or handbag that can fit under the seat in front of you.
If you have two bags, their total weight cannot be more than 10kg. If your bag is too big or
too heavy, you will not be allowed to take it onto the plane. Staff will put it in the hold for you
and you will have to pay extra.
Please make sure mobile phones and other devices are fully charged so that security staff can
check them.
Liquids in bottles bigger than 100ml are allowed on board if you buy them in the airport shops
after you've passed security.
We hope you enjoy your flight!`,
        multipleChoiceQuestions: [
          {
            question: "How many bags can you take as hand luggage?",
            options: ["1", "2", "10"],
            correctAnswer: 1
          },
          {
            question: "Which of these can NOT go as hand luggage?",
            options: [
              "A suitcase and handbag that weigh 10kg in total", 
              "A suitcase, a laptop and a handbag that weigh 10kg in total", 
              "A suitcase and a laptop that weigh 5kg each"
            ],
            correctAnswer: 1
          },
          {
            question: "Which thing can you NOT take in your hand luggage?",
            options: [
              "A mobile phone that doesn't work", 
              "A 500ml bottle of water from a shop after airport security", 
              "A 100ml liquid soap from home"
            ],
            correctAnswer: 0
          },
          {
            question: "What will happen to hand luggage that weighs 11kg?",
            options: [
              "You can keep it with you on the plane if you pay extra.", 
              "It can't go on the plane.", 
              "It has to go under the plane."
            ],
            correctAnswer: 2
          }
        ],
        fillBlanksQuestions: {
          instructions: "Complete the sentences with words from the box.",
          words: ["hold", "Passengers", "allowed", "Security", "weigh", "fully charged"],
          sentences: [
            {
              id: 1,
              text: "____________ can take two bags on board the plane.",
              answer: "Passengers"
            },
            {
              id: 2,
              text: "Ten kilograms is the most your bags can ____________.",
              answer: "weigh"
            },
            {
              id: 3,
              text: "____________ staff might need to check your devices.",
              answer: "Security"
            },
            {
              id: 4,
              text: "You can only take ____________ tablets on board.",
              answer: "fully charged"
            },
            {
              id: 5,
              text: "You are not ____________ to pack liquids from home if they are more than 100ml.",
              answer: "allowed"
            },
            {
              id: 6,
              text: "Heavy bags have to go in the ____________.",
              answer: "hold"
            }
          ]
        }
      },
      b1: {
        title: 'A flyer for a gym',
        text: `BEST BODY FITNESS
About us
You don't want just a gym membership. You want a membership that means something. And
that means you need support, expert help and a community.
Best Body Fitness isn't just a gym: it's a full-service fitness membership made for you.
Here's how it works:
STEP ONE: Your assessment
We begin with an assessment session. This is a chance for you to see what we do at Best
Body. Our assessment plans are no-cost and no-risk. We'll also make a training plan
specifically for you.
STEP TWO: Your training
When you decide to become a Best Body member, we show you what to do, how to do it and
why you are doing it. After a few sessions with an expert private trainer you will feel
comfortable working out on your own. But don't worry, we'll always be nearby if you have
questions.
STEP THREE: Your membership
Membership works on a month-to-month basis. There are no sign-up fees and no cancellation
fees. Start and stop whenever you want. And the best part? Our fees are the most competitive
in the whole downtown area.
STEP FOUR: Your community
At Best Body Fitness, we see everyone as part of a big team. And when you work with a
team, you can do great things. Join any of our specialised classes, led by expert instructors.
Come to our nutrition classes. Participate in our regular social events. Everything is included
in your fee.
Finally, we wanted to share with you some reasons why our members say that they have
chosen us over any other fitness centre in the city.
It's so EASY
• Easy to start, stop, cancel or refund a membership
• Easy to access – we're open 24/7, we never close
• Easy to do exercise – we have lots of equipment, no long wait
• Easy results – our trainers and equipment give you success, fast
• Easy to find – in the centre of town, near public transport and with parking
It's WONDERFUL
• Wonderful members
• Wonderful trainers and staff
• Wonderful equipment
• Wonderful energy
• Wonderful location
Come and visit us for a personal tour!`,
        trueFalseQuestions: [
          {
            statement: "The first visit to the club is free.",
            isTrue: true
          },
          {
            statement: "Everybody gets the same training plan.",
            isTrue: false
          },
          {
            statement: "At this gym, you always do exercise with an expert instructor.",
            isTrue: false
          },
          {
            statement: "If you stop your membership, you don't have to pay anything.",
            isTrue: true
          },
          {
            statement: "This gym says it's the best value for money.",
            isTrue: true
          },
          {
            statement: "Nutrition classes cost a little bit extra.",
            isTrue: false
          },
          {
            statement: "The gym is open at 4 o'clock in the morning.",
            isTrue: true
          },
          {
            statement: "The gym is outside of town.",
            isTrue: false
          }
        ],
        fillBlanksQuestions: {
          instructions: "Complete the sentences with words from the box.",
          words: ["time", "membership", "over", "whenever", "specifically", "own", "led", "nearby"],
          sentences: [
            {
              id: 1,
              text: "The gym offers a full-service fitness ____________.",
              answer: "membership"
            },
            {
              id: 2,
              text: "We'll make a training plan ____________ for you.",
              answer: "specifically"
            },
            {
              id: 3,
              text: "You can now work out on your ____________.",
              answer: "own"
            },
            {
              id: 4,
              text: "We'll always be ____________ to help.",
              answer: "nearby"
            },
            {
              id: 5,
              text: "Start and stop ____________ you want.",
              answer: "whenever"
            },
            {
              id: 6,
              text: "Join any of our classes, ____________ by expert instructors.",
              answer: "led"
            },
            {
              id: 7,
              text: "This is why our members have chosen us ____________ any other gym.",
              answer: "over"
            },
            {
              id: 8,
              text: "Stop, start or refund your membership any ____________.",
              answer: "time"
            }
          ]
        }
      },
      b2: {
        title: 'Job Satisfaction Article',
        text: `What makes a job satisfying? It's an important question, as the average person spends about 90,000 hours at work over their lifetime.

According to recent surveys, job satisfaction has been declining over the past two decades, with only 45% of workers reporting being satisfied with their jobs. The factors contributing to this decline are complex, but several key elements have been identified.

First, autonomy plays a crucial role. People want to have some control over their work - deciding how to approach tasks, when to do them, and sometimes where to do them. Companies that offer flexible working conditions and trust employees to manage their own schedules often report higher satisfaction rates.

Second, a sense of purpose is essential. Employees who believe their work makes a positive difference - whether to customers, society, or the environment - tend to find greater meaning in their daily tasks. This doesn't mean everyone needs to work for a charity; even in commercial settings, understanding how your role contributes to a valuable end product or service can provide this sense of purpose.

Third, opportunities for growth and development keep workers engaged. When people feel they are learning new skills and progressing in their careers, they're more likely to remain motivated. Companies that invest in training programs and create clear advancement paths generally maintain a more satisfied workforce.

Fourth, work relationships matter significantly. Having supportive colleagues and managers can make even challenging work more enjoyable. Research shows that positive social connections at work not only increase job satisfaction but also improve productivity and reduce stress.

Finally, fair compensation and recognition for contributions cannot be overlooked. While studies consistently show that money alone doesn't create lasting job satisfaction, feeling underpaid or undervalued certainly creates dissatisfaction.

Interestingly, job satisfaction isn't necessarily linked to how "prestigious" a role is. Craftspeople, gardeners, and physical therapists often report higher job satisfaction than many higher-paid professionals like lawyers and financial managers. The common thread among satisfying roles tends to be the ability to see the direct results of one's work, engage in varied tasks, and help others in meaningful ways.

As remote work becomes more common, new challenges to job satisfaction have emerged. While many appreciate the flexibility, some report feeling isolated or disconnected from their teams. Organizations are now working to create new ways to foster connection and engagement in virtual environments.

Ultimately, the most satisfied workers tend to have found a balance - between challenge and achievability, between freedom and structure, and between work and personal life. As the nature of work continues to evolve, understanding these fundamental human needs remains key to creating fulfilling work experiences.`,
        multipleChoiceQuestions: [
          {
            question: "According to the article, what percentage of workers report being satisfied with their jobs?",
            options: ["25%", "45%", "65%"],
            correctAnswer: 1
          },
          {
            question: "Which of the following is NOT mentioned as a factor contributing to job satisfaction?",
            options: ["Having control over work tasks", "Working in a prestigious role", "Having supportive colleagues"],
            correctAnswer: 1
          },
          {
            question: "According to the article, professionals with which type of jobs often report higher job satisfaction?",
            options: ["Lawyers and financial managers", "Those who can see direct results of their work", "Those with the highest salaries"],
            correctAnswer: 1
          },
          {
            question: "What new challenge to job satisfaction does the article mention?",
            options: ["Increased workload", "Feelings of isolation in remote work", "Mandatory overtime"],
            correctAnswer: 1
          }
        ],
        categorizationQuestions: {
          instructions: "Categorize each item as either a factor that INCREASES job satisfaction or DECREASES job satisfaction according to the article.",
          categories: ["Increases Satisfaction", "Decreases Satisfaction"],
          items: [
            {
              text: "Having flexibility in work schedule",
              correctCategory: "Increases Satisfaction"
            },
            {
              text: "Feeling underpaid for your work",
              correctCategory: "Decreases Satisfaction"
            },
            {
              text: "Seeing direct results of your work",
              correctCategory: "Increases Satisfaction"
            },
            {
              text: "Lack of learning opportunities",
              correctCategory: "Decreases Satisfaction"
            },
            {
              text: "Supportive relationships with colleagues",
              correctCategory: "Increases Satisfaction"
            },
            {
              text: "Feeling disconnected from team members",
              correctCategory: "Decreases Satisfaction"
            },
            {
              text: "Understanding how your role contributes to the end product",
              correctCategory: "Increases Satisfaction"
            },
            {
              text: "Limited control over how to approach tasks",
              correctCategory: "Decreases Satisfaction"
            }
          ]
        }
      },
      c1: {
        title: 'The Evolution of Urban Agriculture',
        text: `THE RISE OF URBAN AGRICULTURE: TRANSFORMING CITIES FROM CONCRETE JUNGLES TO FOOD PRODUCERS

The concept of growing food in urban environments is hardly new – city dwellers have cultivated small gardens for millennia. However, what was once primarily a hobby or necessity during wartime food shortages has evolved into a sophisticated movement that is transforming urban landscapes and challenging our traditional notions of agriculture and food systems.

Urban agriculture encompasses a spectrum of practices, from community gardens and rooftop farms to vertical growing systems and high-tech indoor operations. What unites these diverse approaches is their location within or around urban areas and their integration into the local economic and ecological systems. As our global population becomes increasingly urbanized – with projections suggesting 68% of humanity will live in cities by 2050 – the importance of these initiatives extends far beyond simply growing food.

The environmental benefits of urban agriculture are substantial. By producing food where it is consumed, cities can significantly reduce the "food miles" associated with their sustenance, thereby lowering carbon emissions from transportation. Urban farms also help mitigate the urban heat island effect, improve air quality, increase biodiversity, and manage stormwater runoff. Particularly innovative are the closed-loop systems that recycle organic waste into compost for food production, creating circular economies within dense urban environments.

From a social perspective, urban agriculture strengthens community bonds and promotes food security in areas often designated as "food deserts" – neighborhoods with limited access to fresh, nutritious food. Community gardens and farm-to-school programs have proven particularly effective at educating young people about nutrition and environmental stewardship, while providing spaces for intergenerational and cross-cultural exchange.

Economically, urban agriculture creates jobs and opportunities for entrepreneurship in food production, processing, and distribution. In cities struggling with post-industrial decline, urban farms have revitalized vacant lots and abandoned buildings, generating economic activity in areas previously considered unproductive. The local food economy that develops around these initiatives keeps money circulating within communities rather than flowing to distant agribusiness corporations.

Despite these benefits, urban agriculture faces significant challenges. Land in cities is expensive and often contaminated from previous industrial uses, requiring remediation before food production can safely occur. Zoning regulations frequently restrict agricultural activities in urban areas, though many cities are now updating their codes to accommodate and even encourage urban farming. Access to capital remains difficult for urban farmers, particularly those from historically marginalized communities.

Water access and quality present another challenge, though many urban agriculture projects have pioneered innovative water conservation techniques, including rainwater harvesting and greywater recycling systems. Climate change introduces additional uncertainty, as urban farmers must adapt to shifting growing seasons, extreme weather events, and new pest pressures.

The technological frontier of urban agriculture offers potential solutions to some of these challenges. Controlled environment agriculture (CEA) – including hydroponics, aeroponics, and aquaponics – allows year-round production regardless of external conditions, while using significantly less water than conventional farming. Vertical farming maximizes production in limited space by growing crops in stacked layers, often using LED lighting tuned to optimal wavelengths for plant growth. These high-tech approaches, while energy-intensive, can produce impressive yields in small spaces without pesticides.

Looking forward, the most promising models appear to be hybrid systems that combine technological innovation with ecological wisdom and community engagement. As cities continue to evolve, urban agriculture will likely become an increasingly integrated component of urban planning, infrastructure development, and public health strategies. The concrete jungle, it seems, is gradually being reclaimed by strategic patches of green that nourish both people and the planet.`,
        multipleChoiceQuestions: [
          {
            question: "According to the text, what percentage of the global population is projected to live in cities by 2050?",
            options: ["50%", "68%", "75%"],
            correctAnswer: 1
          },
          {
            question: "Which of the following is NOT mentioned as an environmental benefit of urban agriculture?",
            options: ["Reducing carbon emissions from food transportation", "Creating habitat for endangered species", "Managing stormwater runoff"],
            correctAnswer: 1
          },
          {
            question: "What term does the text use to describe neighborhoods with limited access to fresh, nutritious food?",
            options: ["Nutrition deserts", "Food wastelands", "Food deserts"],
            correctAnswer: 2
          },
          {
            question: "According to the text, which of the following is a challenge facing urban agriculture?",
            options: ["Land in cities is expensive and often contaminated", "Too many cities have zoning regulations that favor agriculture", "Excessive rainfall in urban areas"],
            correctAnswer: 0
          }
        ],
        fillBlanksQuestions: {
          instructions: "Complete the text with the missing words.",
          text: "Urban agriculture encompasses a spectrum of practices, from ____________ gardens and rooftop farms to ____________ growing systems and high-tech indoor operations. The environmental benefits include reducing '____________ miles', mitigating the urban ____________ island effect, and creating ____________ economies within dense urban environments. From a social perspective, urban agriculture strengthens community bonds and promotes food ____________ in areas often designated as 'food deserts'.",
          answers: ["community", "vertical", "food", "heat", "circular", "security"]
        },
        categorizationQuestions: {
          instructions: "Categorize each item as either a BENEFIT or a CHALLENGE of urban agriculture according to the text.",
          categories: ["Benefit", "Challenge"],
          items: [
            {
              text: "Reduces carbon emissions from food transportation",
              correctCategory: "Benefit"
            },
            {
              text: "Land in cities is expensive",
              correctCategory: "Challenge"
            },
            {
              text: "Creates jobs and opportunities for entrepreneurship",
              correctCategory: "Benefit"
            },
            {
              text: "Soil contamination from previous industrial uses",
              correctCategory: "Challenge"
            },
            {
              text: "Improves air quality in cities",
              correctCategory: "Benefit"
            },
            {
              text: "Restrictive zoning regulations",
              correctCategory: "Challenge"
            },
            {
              text: "Helps manage stormwater runoff",
              correctCategory: "Benefit"
            },
            {
              text: "Climate change and extreme weather events",
              correctCategory: "Challenge"
            }
          ]
        }
      }
    };
    
    // Return the data for the requested level or default data if level not found
    return assessmentData[normalizedLevel] || defaultData;
  }

  /**
   * Submit a reading assessment
   * @param {Object} assessmentData - Assessment data
   * @param {String} userId - User ID
   * @returns {Promise<Object>} - Created assessment
   */
  async submitAssessment(assessmentData, userId) {
    try {
      // Create a new assessment with user data
      const newAssessment = new ReadingAssessment({
        user: userId,
        level: assessmentData.level,
        language: assessmentData.language,
        score: assessmentData.score,
        multipleChoiceAnswers: assessmentData.multipleChoiceAnswers || {},
        trueFalseAnswers: assessmentData.trueFalseAnswers || {},
        fillBlanksAnswers: assessmentData.fillBlanksAnswers || {},
        categorizationAnswers: assessmentData.categorizationAnswers || {},
        timeSpent: assessmentData.timeSpent || 0
      });
      
      // Save to database
      const savedAssessment = await newAssessment.save();
      
      return {
        success: true,
        assessment: savedAssessment
      };
    } catch (error) {
      console.error('Error submitting reading assessment:', error);
      throw error;
    }
  }
  
  /**
   * Check if a user can take a specific assessment
   * @param {String} userId - User ID
   * @param {String} level - CEFR level
   * @param {String} language - Language
   * @returns {Promise<Object>} - Availability data
   */
  async checkAssessmentAvailability(userId, level, language) {
    try {
      // Use the model's canTakeAssessment method to check availability
      const availabilityData = await ReadingAssessment.canTakeAssessment(
        userId,
        level.toLowerCase(),
        language.toLowerCase()
      );
      
      return availabilityData;
    } catch (error) {
      console.error('Error checking reading assessment availability:', error);
      // Return available by default if there's an error
      return { available: true };
    }
  }
  
  /**
   * Get a user's reading assessment history
   * @param {String} userId - User ID
   * @returns {Promise<Array>} - Assessment history
   */
  async getAssessmentHistory(userId) {
    try {
      const history = await ReadingAssessment.find(
        { user: userId },
        {
          level: 1,
          language: 1,
          score: 1,
          completedAt: 1,
          timeSpent: 1
        },
        { sort: { completedAt: -1 } }
      );
      
      return history;
    } catch (error) {
      console.error('Error fetching reading assessment history:', error);
      // Return empty array if there's an error
      return [];
    }
  }
  
  /**
   * Get statistics for reading assessments
   * @param {String} userId - User ID
   * @param {Object} filters - Optional filters like level, language
   * @returns {Promise<Object>} - Statistics data
   */
  async getStatistics(userId, filters = {}) {
    try {
      // Base query for the user
      const query = { user: userId };
      
      // Add optional filters
      if (filters.level) {
        query.level = filters.level.toLowerCase();
      }
      
      if (filters.language) {
        query.language = filters.language.toLowerCase();
      }
      
      // Get all matching assessments
      const assessments = await ReadingAssessment.find(
        query,
        {
          level: 1,
          language: 1,
          score: 1,
          completedAt: 1,
          timeSpent: 1
        },
        { sort: { completedAt: 1 } }
      );
      
      // Initialize result object with default values
      const result = {
        totalAssessments: assessments.length || 0,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 100,
        progressOverTime: [],
        byLevel: {},
        byLanguage: {}
      };
      
      // Return default stats if no assessments
      if (!assessments || assessments.length === 0) {
        return result;
      }
      
      // Calculate statistics
      if (assessments.length > 0) {
        // Calculate basic stats
        const totalScore = assessments.reduce((sum, a) => sum + a.score, 0);
        result.averageScore = totalScore / assessments.length;
        
        // Find highest and lowest scores
        result.highestScore = Math.max(...assessments.map(a => a.score));
        result.lowestScore = Math.min(...assessments.map(a => a.score));
        
        // Progress over time
        result.progressOverTime = assessments.map(a => ({
          date: a.completedAt,
          score: a.score,
          level: a.level.toUpperCase(),
          language: a.language
        }));
        
        // Group by level
        const levelGroups = assessments.reduce((groups, a) => {
          const level = a.level;
          if (!groups[level]) {
            groups[level] = [];
          }
          groups[level].push(a);
          return groups;
        }, {});
        
        // Calculate level stats
        Object.keys(levelGroups).forEach(level => {
          const levelAssessments = levelGroups[level];
          const levelTotalScore = levelAssessments.reduce((sum, a) => sum + a.score, 0);
          
          result.byLevel[level] = {
            count: levelAssessments.length,
            averageScore: levelTotalScore / levelAssessments.length,
            highestScore: Math.max(...levelAssessments.map(a => a.score)),
            lowestScore: Math.min(...levelAssessments.map(a => a.score)),
            latestScore: levelAssessments[levelAssessments.length - 1].score
          };
        });
        
        // Group by language
        const languageGroups = assessments.reduce((groups, a) => {
          const language = a.language;
          if (!groups[language]) {
            groups[language] = [];
          }
          groups[language].push(a);
          return groups;
        }, {});
        
        // Calculate language stats
        Object.keys(languageGroups).forEach(language => {
          const languageAssessments = languageGroups[language];
          const languageTotalScore = languageAssessments.reduce((sum, a) => sum + a.score, 0);
          
          result.byLanguage[language] = {
            count: languageAssessments.length,
            averageScore: languageTotalScore / languageAssessments.length,
            highestScore: Math.max(...languageAssessments.map(a => a.score)),
            lowestScore: Math.min(...languageAssessments.map(a => a.score)),
            latestScore: languageAssessments[languageAssessments.length - 1].score
          };
        });
      }
      
      return result;
    } catch (error) {
      console.error('Error getting reading assessment statistics:', error);
      // Return empty stats if there's an error
      return {
        totalAssessments: 0,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
        progressOverTime: [],
        byLevel: {},
        byLanguage: {}
      };
    }
  }
}

// Create and export service instance
const readingAssessmentService = new ReadingAssessmentService();
export default readingAssessmentService; 