import axios from 'axios';
import { getAuthToken } from '../utils/auth';

/**
 * Service for handling reading assessment API interactions
 */
class ReadingAssessmentService {
  constructor() {
    // Set base API URL 
    this.apiUrl = `/api/reading-assessment`;
    console.log('ReadingAssessmentService using API URL:', this.apiUrl);
    
    // Set up axios instance with auth headers
    this.api = axios.create({
      baseURL: this.apiUrl,
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    // Add auth token to all requests
    this.api.interceptors.request.use((config) => {
      const token = getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  /**
   * Submit a reading assessment to the backend
   * @param {Object} assessmentData - Assessment data including level, language, score, answers
   * @returns {Promise<Object>} - Response from the server
   */
  async submitAssessment(assessmentData) {
    try {
      const response = await this.api.post('/submit', assessmentData);
      return response.data;
    } catch (error) {
      console.error('Error submitting reading assessment:', error);
      throw error;
    }
  }

  /**
   * Check if a user can take a specific reading assessment
   * @param {string} level - CEFR level
   * @param {string} language - Language
   * @returns {Promise<Object>} - Availability data
   */
  async checkAssessmentAvailability(level, language) {
    try {
      const response = await this.api.get('/availability', {
        params: { level, language }
      });
      return response.data;
    } catch (error) {
      console.error('Error checking reading assessment availability:', error);
      throw error;
    }
  }

  /**
   * Get reading assessment data for a specific level and language
   * @param {string} level - CEFR level
   * @param {string} language - Language
   * @returns {Promise<Object>} - Reading assessment data
   */
  async getAssessmentData(level, language) {
    try {
      const response = await this.api.get('/data', {
        params: { level, language }
      });
      
      console.log('API response for reading assessment data:', response);
      
      // Check if the response has the expected structure
      if (response.data && response.data.success === true && response.data.data) {
        return response.data.data;
      } else if (response.data && response.data.success === false) {
        console.warn('API returned success: false for reading assessment data');
        throw new Error(response.data.message || 'Failed to get reading assessment data');
      } else {
        return response.data; // Return whatever data we got
      }
    } catch (error) {
      console.error('Error getting reading assessment data:', error);
      // Return local fallback data
      return this.getLocalAssessmentData(level, language);
    }
  }

  /**
   * Get user's reading assessment history
   * @returns {Promise<Array>} - Assessment history
   */
  async getAssessmentHistory() {
    try {
      const response = await this.api.get('/history');
      return response.data;
    } catch (error) {
      console.error('Error fetching reading assessment history:', error);
      throw error;
    }
  }

  /**
   * Get statistics for reading assessments
   * @param {string} level - Optional CEFR level filter
   * @param {string} language - Optional language filter
   * @returns {Promise<Object>} - Statistics data
   */
  async getStatistics(level, language) {
    try {
      const response = await this.api.get('/statistics', {
        params: { level, language }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching reading assessment statistics:', error);
      throw error;
    }
  }

  /**
   * Get local fallback assessment data for specific level and language
   * @param {string} level - CEFR level
   * @param {string} language - Language
   * @returns {Object} - Reading assessment data
   */
  getLocalAssessmentData(level, language) {
    // Return predefined assessment data for A1 and A2 levels
    const assessments = {
      a1: {
        level: 'a1',
        language: language,
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
        ],
        timeLimit: 600 // 10 minutes in seconds
      },
      a2: {
        level: 'a2',
        language: language,
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
        fillInBlanks: {
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
        },
        timeLimit: 900 // 15 minutes in seconds
      },
      b1: {
        level: 'b1',
        language: language,
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
        fillInBlanks: {
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
        },
        timeLimit: 1200 // 20 minutes in seconds
      },
      b2: {
        level: 'b2',
        language: language,
        title: 'A short story extract',
        text: `Sam squinted against the sun at the distant dust trail raked up by the car on its way up to the
Big House. The horses kicked and flicked their tails at flies, not caring about their owner's first
visit in ten months. Sam waited. Mr Carter didn't come out here unless he had to, which was
just fine by Sam. The more he kept out of his boss's way, the longer he'd have a job.
Carter came by later while Sam was chopping wood. Carter lifted his hat as if he were waiting
for an appointment with the town priest, and then removed it completely as if he were talking
to his mother. He pulled out a pile of paper from his back pocket and held it out.
'Don't pick up your mail often, do you?'
Sam took it without a glance and dropped the envelopes onto the bench.
'Never,' he replied and waited for Carter to say why he was here. The fact it was Carter's
house was no explanation and they both knew it. Carter twisted his hat round and round,
licking his lips and clearing his throat.
'Nice work fixing those fences,' he said finally.
'I'll be back to the beginning soon,' Sam said. It wasn't a complaint. A fence that took a year to
repair meant another year's work to the man who did it well.
'Don't you ever want to take a holiday?'
'And go where?' A holiday meant being back out in the real world, a place even people like
Carter travelled to escape from. Sam's escape was his reality and he wasn't going back.
Mr Carter wiped the sweat from the back of his neck. The damp patches on his shirt drew
together like shapes in an atlas. His skin was already turning ruddy in the June sun. Otherwise
he had the indoor tan of a man that made money while other people did the work.
'I've brought my son with me on this trip. He's had some trouble at school.' Mr Carter's eyes
flicked up, blinked rapidly and then shifted back to the hat occupying his hands. 'Not much
trouble out here for a young boy.' He attempted a laugh but it came out like a dog's bark.
The two men looked towards the northern end of the property. It stretched as far as the eye
could see. Even the fences were barely visible from where they stood. However bored and
rebellious a teenage boy might get, it wasn't possible to escape on foot. Sam looked at the
biggest of the horses, kicking at the ground with its heavy hooves. Could the boy ride? he
wondered. There was a whole load of trouble a good rider could get into out here, miles away
from anyone. But maybe there was even more trouble for someone who knew nothing about
horses and wanted to get away from his father.`,
        categorization: {
          title: "Task 1",
          instructions: "Put the descriptions in the correct group.",
          items: [
            { id: 1, text: "Lives on the farm" },
            { id: 2, text: "Works with his hands" },
            { id: 3, text: "Owns the farm" },
            { id: 4, text: "Doesn't often come to the farm" },
            { id: 5, text: "Comes to the farm less often than the others" },
            { id: 6, text: "Has done something wrong" }
          ],
          categories: [
            { id: "sam", name: "Sam", correctItems: [1, 2] },
            { id: "mrCarter", name: "Mr Carter", correctItems: [3, 4] },
            { id: "son", name: "Mr Carter's son", correctItems: [5, 6] }
          ]
        },
        multipleChoiceQuestions: [
          {
            question: "What is Sam's reaction to his letters?",
            options: [
              "Uninterested",
              "Surprised", 
              "Afraid", 
              "Curious"
            ],
            correctAnswer: 0
          },
          {
            question: "Why does Sam not take holidays from work?",
            options: [
              "He feels safer on the farm.",
              "He can't afford it.",
              "He hasn't finished repairing the fences.",
              "He doesn't know where to choose."
            ],
            correctAnswer: 0
          },
          {
            question: "What can we guess about Mr Carter?",
            options: [
              "He works hard.",
              "He's rich.",
              "He has tanned skin.",
              "He loves horses."
            ],
            correctAnswer: 1
          },
          {
            question: "What does Sam think Carter's son might do during his stay at the farm?",
            options: [
              "He might leave on foot.",
              "He might do something dangerous while riding.",
              "He might break the fences.",
              "He might get into trouble with the neighbours."
            ],
            correctAnswer: 1
          },
          {
            question: "How does Mr Carter feel while he's talking to Sam in this scene?",
            options: [
              "Angry",
              "Impatient",
              "Nervous",
              "Excited"
            ],
            correctAnswer: 2
          },
          {
            question: "Why has Mr Carter come to his house?",
            options: [
              "Because he wants to give Sam his mail.",
              "Because he needs to check on the work on the fences.",
              "Because his son has had problems at school.",
              "Because his son needs a holiday."
            ],
            correctAnswer: 2
          }
        ],
        timeLimit: 1800 // 30 minutes in seconds
      },
      c1: {
        level: 'c1',
        language: language,
        title: 'A biography of Kilian Jornet',
        text: `When you picture mountain climbers scaling Mount Everest, what probably comes to mind are
teams of climbers with Sherpa guides leading them to the summit, equipped with oxygen
masks, supplies and tents. And in most cases you'd be right, as 97 per cent of climbers use
oxygen to ascend to Everest's summit at 8,850 metres above sea level. The thin air at high
altitudes makes most people breathless at 3,500 metres, and the vast majority of climbers use
oxygen past 7,000 metres. A typical climbing group will have 8–15 people in it, with an almost
equal number of guides, and they'll spend weeks to get to the top after reaching Base Camp.
But ultra-distance and mountain runner Kilian Jornet Burgada ascended the mountain in May
2017 alone, without an oxygen mask or fixed ropes for climbing.
Oh, and he did it in 26 hours.
With food poisoning.
And then, five days later, he did it again, this time in only 17 hours.
Born in 1987, Kilian has been training for Everest his whole life. And that really does mean his
whole life, as he grew up 2,000 metres above sea level in the Pyrenees in the ski resort of
Lles de Cerdanya in Catalonia, north-eastern Spain. While other children his age were learning
to walk, Kilian was on skis. At one and a half years old he did a five-hour hike with his mother,
entirely under his own steam. He left his peers even further behind when he climbed his first
mountain and competed in his first cross-country ski race at age three. By age seven, he had
scaled a 4,000er and, at ten, he did a 42-day crossing of the Pyrenees.
He was 13 when he says he started to take it 'seriously' and trained with the Ski
Mountaineering Technical Centre (CTEMC) in Catalonia, entering competitions and working
with a coach. At 18, he took over his own ski-mountaineering and trail-running training, with a
schedule that only allows a couple of weeks of rest a year. He does as many as 1,140 hours of
endurance training a year, plus strength training and technical workouts as well as specific
training in the week before a race. For his record-breaking ascent and descent of the
Matterhorn, he prepared by climbing the mountain ten times until he knew every detail of it,
even including where the sun would be shining at every part of the day.
Sleeping only seven hours a night, Kilian Jornet seems almost superhuman. His resting
heartbeat is extremely low at 33 beats per minute, compared with the average man's 60 per
minute or an athlete's 40 per minute. He breathes more efficiently than average people too,
taking in more oxygen per breath, and he has a much faster recovery time after exercise as
his body quickly breaks down lactic acid – the acid in muscles that causes pain after exercise.
All this is thanks to his childhood in the mountains and to genetics, but it is his mental strength
that sets him apart. He often sets himself challenges to see how long he can endure difficult
conditions in order to truly understand what his body and mind can cope with. For example,
he almost gave himself kidney failure after only drinking 3.5 litres of water on a 100km run in
temperatures of around 40°C.
It would take a book to list all the races and awards he's won and the mountains he's climbed.
And even here, Kilian's achievements exceed the average person as, somehow, he finds time
to record his career on his blog and has written three books, Run or Die, The Invisible
Border and Summits of My Life.`,
        fillInBlanks: {
          instructions: "Write the correct numbers to complete the sentences.",
          words: ["3,500", "17", "1.5", "13", "18", "33"],
          sentences: [
            {
              id: 1,
              text: "It's normal to find it hard to breathe at ____________ metres above sea level.",
              answer: "3,500"
            },
            {
              id: 2,
              text: "Kilian reached the summit of Everest in ____________ hours on his second attempt.",
              answer: "17"
            },
            {
              id: 3,
              text: "He was ____________ years old when he walked a long way without being carried.",
              answer: "1.5"
            },
            {
              id: 4,
              text: "At the age of ____________, he saw mountaineering as more than a hobby.",
              answer: "13"
            },
            {
              id: 5,
              text: "At age ____________, he became his own trainer.",
              answer: "18"
            },
            {
              id: 6,
              text: "At ____________ bpm, Kilian's pulse rate is much slower than even very fit people.",
              answer: "33"
            }
          ]
        },
        multipleChoiceQuestions: [
          {
            question: "The majority of climbers on Everest …",
            options: [
              "need oxygen to finish their ascent.",
              "are accompanied.",
              "make slow progress to the top.",
              "(all of the above)"
            ],
            correctAnswer: 3
          },
          {
            question: "Kilian Jornet is unlike most Everest climbers because …",
            options: [
              "he is a professional climber.",
              "he ascended faster.",
              "he found the climb difficult.",
              "(all of the above)"
            ],
            correctAnswer: 1
          },
          {
            question: "In his training now, Kilian …",
            options: [
              "demands a lot of himself.",
              "takes a lot of rest periods.",
              "uses a coach.",
              "(none of the above)"
            ],
            correctAnswer: 0
          },
          {
            question: "Kilian partly owes his incredible fitness to …",
            options: [
              "the way he makes extra time for sleep.",
              "his ability to recover from injury.",
              "where he grew up.",
              "(all of the above)"
            ],
            correctAnswer: 2
          },
          {
            question: "His training includes …",
            options: [
              "psychological preparation.",
              "making sure he drinks enough water.",
              "trying to reduce his recovery time.",
              "(none of the above)"
            ],
            correctAnswer: 0
          },
          {
            question: "Kilian's books are …",
            options: [
              "a long list of races and awards.",
              "discouraging to average people.",
              "best for an expert audience.",
              "another example of his impressive accomplishments."
            ],
            correctAnswer: 3
          }
        ],
        timeLimit: 2400 // 40 minutes in seconds
      }
    };

    return assessments[level] || assessments.a1;
  }
}

const readingAssessmentService = new ReadingAssessmentService();
export default readingAssessmentService; 