import React, { useState, useEffect, useRef } from 'react';
import CEFRService from '../../services/cefr.service';
import listeningAssessmentService from '../../services/listeningAssessment.service.js';

const ListeningAssessment = ({ onComplete, level, language, onBack }) => {
  const [answers, setAnswers] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [timeLeft, setTimeLeft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orderingAnswers, setOrderingAnswers] = useState([0, 0, 0, 0, 0, 0]);
  const [classificationAnswers, setClassificationAnswers] = useState({});
  const [categorizationAnswers, setCategorizationAnswers] = useState({});
  const [fillBlanksAnswers, setFillBlanksAnswers] = useState({});
  const [availableWords, setAvailableWords] = useState([]);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [assessmentData, setAssessmentData] = useState(null);
  const [assessmentAvailability, setAssessmentAvailability] = useState(null);
  const [assessmentUnavailable, setAssessmentUnavailable] = useState(false);
  const audioRef = useRef(null);
  const [trueFalseAnswers, setTrueFalseAnswers] = useState({});
  const [phraseMatchingAnswers, setPhraseMatchingAnswers] = useState({});
  // Add state to track which phrases are being used
  const [usedPhrases, setUsedPhrases] = useState({});

  // A1 voicemail message transcript
  const a1VoicemailTranscript = `John: Hi, this is John. Thanks for calling. I'm not here at the moment, so please leave a
message and I'll call you back.
Marina: Hi, John, this is Marina Silva calling from Old Time Toys. Your colleague Alex gave me
your phone number. She said you can help me.
I need some information on your new products. Could you please call me when you are back
in the office? My phone number is 0-2-0-8, 6-5-5-7-6-2-1.
Also, can you please email me your new brochure and information about your prices? My
email address is Marina, that's M-A-R-I-N-A, dot Silva, that's S-I-L-V-A, at O-L-D-T-I-M-E hyphen
toys dot com.
Thanks a lot. I look forward to hearing from you.`;

  // A1 voicemail Task 2 - Ordering actions
  const a1VoicemailOrderingTask = {
    title: "Task 2",
    instructions: "Write a number (1–6) to put the actions in the order they are mentioned.",
    items: [
      { id: 1, text: "Marina says that she needs some product information." },
      { id: 2, text: "Marina introduces herself." },
      { id: 3, text: "Marina leaves her email address." },
      { id: 4, text: "Marina says how she got John's phone number." },
      { id: 5, text: "Marina asks for a brochure and prices." },
      { id: 6, text: "Marina asks John to call her back." }
    ],
    correctOrder: [2, 4, 1, 6, 5, 3] // The correct ordering (1-indexed)
  };

  // A2 morning briefing transcript
  const a2MorningBriefingTranscript = `Manager: OK, everyone. Good morning and welcome to the daily briefing. For those of you who 
don't know me, I'm Carlos, the restaurant manager. 
Right, so, today the staff are: Jane, Bob, Lina and me. Fernando is off sick today, so Jane, 
you'll be looking after eight tables in the back corner, OK?
Jane: OK.
Manager: Now, today's special is salmon pasta – it's fresh salmon, and it's a really good dish,
so tell the customers about it. And the most popular drink today is our special fruit tea. 
It's a cold day so a lot of people are ordering it.
And Jane, can you make sure you go and welcome customers, say hello. Um, ask if they 
need any information about the food. OK, that's it. Any questions?
Jane: No. 
Manager: All right, have a good day everyone.`;

  // A2 morning briefing Task 2 - Ordering items
  const a2MorningBriefingOrderingTask = {
    title: "Task 2",
    instructions: "Write a number (1–5) to put these things in the order they are mentioned.",
    items: [
      { id: 1, text: "The manager says who today's staff are." },
      { id: 2, text: "The manager asks Jane to talk to all customers." },
      { id: 3, text: "The manager says how many tables Jane will work at." },
      { id: 4, text: "The manager explains what the special food is." },
      { id: 5, text: "The manager says what drink is very popular." }
    ],
    correctOrder: [1, 3, 4, 5, 2] // The correct ordering (1-indexed)
  };

  // A2 briefing transcript
  const a2BriefingTranscript = `Hi, everyone. I know you're all busy so I'll keep this briefing quick. I have some important
information about a change in the management team. As you already know, our head of
department, James Watson, is leaving his position at the end of this week. His replacement is
starting at the end of the next month. In the meantime, we'll continue with our projects as
usual.
I have two more quick points. Firstly, there will be some improvements made to the staff car
park next month for a few weeks. It will be closed during that time.
Don't worry, we've found a solution. We can use the local church car park until our own one is
ready. If you arrive before 8.30 a.m., please use our small car park on Brown Street, and if you
arrive after that, you should go directly to the church car park. It's only a five-minute walk
away. But they need it in the evenings, so you have to leave before 6 p.m. Sorry about that – I
know how much you all love working late!
The other thing I wanted to tell you about is that the canteen has now introduced a cashless
payment system. So, you can't use cash for payments any more. You can pay directly with
your smartphone or you can pay using your company ID card. The total amount put on your
company ID card comes off your salary at the end of each month.
OK. That's it? Are there any questions?`;

  // A2 briefing Task 2 - Classification task
  const a2BriefingClassificationTask = {
    title: "Task 2",
    instructions: "Write the words in the correct group.",
    items: [
      { id: 1, text: "Firstly, there will be …" },
      { id: 2, text: "I have two more quick points." },
      { id: 3, text: "If you arrive before 8.30 a.m., please use …" },
      { id: 4, text: "If you arrive after that you should go directly to …" },
      { id: 5, text: "The other thing I want to tell you about is …" },
      { id: 6, text: "You have to leave before 6 p.m." }
    ],
    categories: [
      { id: "info", name: "Giving information", correctItems: [1, 2, 5] },
      { id: "instr", name: "Giving instructions", correctItems: [3, 4, 6] }
    ]
  };

  // B1 Mars transcript
  const b1MarsTranscript = `Teacher: So you've got a few minutes to discuss with your partner.
Student 1: So, as far as I know, the main similarity between Mars and Earth is that they can
both support human life.
Student 2: Yeah, but do we know that's actually true? I mean, Mars is much colder than Earth,
isn't it? It says here it's about minus 55 degrees most of the time, whereas on Earth only
places like Antarctica get that cold.
Student 1: True. Well then, I suppose you could say both planets are a similar distance from
the Sun?
Student 2: No way! Mars is much further away! It says here it's about 228 million kilometres,
while Earth is about 150 million.
Student 1: Yes, but in space that's not that far. Jupiter is, like, almost 780 million kilometres.
That's why we use astronomical units when we talk about distances in space. Earth is 1
astronomical unit from the Sun and Mars is 1.3. The difference doesn't sound so big when you
look at it that way.
Student 2: I see what you mean. Jupiter is 5.2 astronomical units so I guess you're right. What
other similarities are there between the two planets?
Student 1: Let's see … not the colour, obviously!
Student 2: Yeah! Earth is called the blue planet and Mars is called the red planet for pretty
obvious reasons!
Student 1: Their sizes are pretty different. Mars is about half the size of Earth.
Student 2: What about this? It looks like the days on both planets are almost the same length.
Earth's day is 24 hours but Mars's is about half an hour longer.
Student 1: You're right. OK, any other things they both share?
Student 2: I suppose you could say they have water in common.
Student 1: Could you? How?
Student 2: Well, Earth is 70 per cent water and Mars probably had huge oceans in the past.
It's just that most of the water there now is probably frozen.
Student 1: Ah, I see. I don't think we can say the air is the same, though. Most of Earth's air is
nitrogen and oxygen, but Mars …?
Student 2: Mars doesn't really have air, not compared with Earth. It's got about one per
cent as much air as Earth.
Student 1: Right, and it's mostly carbon dioxide.
Student 2: Gravity is another difference. I didn't know this, but Mars has higher gravity than
the Moon. But it's much less than on Earth, of course.
Student 1: Oh, yes. It says Mars has about 38 per cent of Earth's gravity.
Teacher: OK, let's see what you've found …`;

  // B1 Mars Task 1 - Categorization task
  const b1MarsCategorization = {
    title: "Task 1",
    instructions: "Write the characteristics in the correct group.",
    items: [
      { id: 1, text: "Has more air" },
      { id: 2, text: "Is closer to the Sun" },
      { id: 3, text: "Is colder" },
      { id: 4, text: "Has stronger gravity" },
      { id: 5, text: "Is 50 per cent smaller" },
      { id: 6, text: "Has more nitrogen and oxygen than carbon dioxide" },
      { id: 7, text: "Used to have water" },
      { id: 8, text: "Has a longer day" }
    ],
    categories: [
      { id: "earth", name: "Earth", correctItems: [1, 2, 4, 6] },
      { id: "mars", name: "Mars", correctItems: [3, 5, 7, 8] }
    ]
  };

  // B1 Mars Task 2 - Fill in the blanks task
  const b1MarsFillBlanks = {
    title: "Task 2",
    instructions: "Complete the sentences with words from the box.",
    options: [
      "astronomical",
      "nitrogen",
      "frozen",
      "support",
      "Gravity",
      "same"
    ],
    sentences: [
      {
        id: 1,
        text: "Most people think Mars can ________ human life.",
        answer: "support"
      },
      {
        id: 2,
        text: "We measure distances in space using ________ units.",
        answer: "astronomical"
      },
      {
        id: 3,
        text: "The two planets aren't the ________ colour.",
        answer: "same"
      },
      {
        id: 4,
        text: "Most of the water on Mars is probably ________ .",
        answer: "frozen"
      },
      {
        id: 5,
        text: "The air on Earth is mostly made up of ________ .",
        answer: "nitrogen"
      },
      {
        id: 6,
        text: "________ on Mars is just over one third as strong as on Earth.",
        answer: "Gravity"
      }
    ]
  };

  // B2 Design Presentation transcript
  const b2DesignPresentationTranscript = `Hi, everyone. Thanks for coming to this short presentation on our new product design. As you
know, we've already redeveloped our 'Adventure' shampoo to make it more modern and
appealing. And we've renamed it 'Adventure Tech'. Our market research established the target
market as men in the 18–40 age range who like to be outdoors and also like technical
gadgets, such as smartwatches, drones and things like that. We needed to create a bottle
which appeals to that market.
So, today, I'm happy to unveil our new bottle design. As you can see, it's designed to look like
a black metal drinking flask, with some digital features printed on it.
I'd like to talk you through the following three points: the key features, sizing and our timeline
for production.
Firstly, you'll notice it has an ergonomic design. That means it fits smoothly into your hand and
can be easily opened and squeezed using one hand. And, it looks like a flask you might use
when hiking outdoors. The imitation digital displays are designed to remind the user of other
tech devices they may have, such as a smartwatch or smart displays in their home.
I'd now like to tell you about the sizes. It comes in two sizes: the regular size and a small travel
size. The travel size is the same type of design – a flask, also with imitation digital displays on
the bottle. We were thinking of starting with one and following with the travel-size in a few
months, but we've worked hard and both are ready now.
Finally, I'm going to talk to you about our timeline for production. You've probably heard that
we're launching in two months. In preparation for that, we're starting the marketing campaign
next month. You can see the complete overview of all phases in this Gantt chart.
In summary, the bottle's been designed for men who like adventure and technology, and it
comes in two sizes. The marketing campaign is starting next month and we're launching the
product in two months.
OK. So, any questions? Feel free to also email me for further information in case we run out of
time.`;

  // B2 Design Presentation Task 1 - True/False questions
  const b2DesignPresentationTrueFalse = {
    title: "Task 1",
    instructions: "Are the sentences true or false?",
    items: [
      { 
        id: 1, 
        text: "They have redesigned an old product.", 
        answer: true 
      },
      { 
        id: 2, 
        text: "The product is aimed at men and women aged 18–40.", 
        answer: false 
      },
      { 
        id: 3, 
        text: "The new design means you don't need two hands to use it.", 
        answer: true 
      },
      { 
        id: 4, 
        text: "There's only one size now. Another one will follow in a few months.", 
        answer: false 
      },
      { 
        id: 5, 
        text: "They will make a Gantt chart for the project next month.", 
        answer: false 
      },
      { 
        id: 6, 
        text: "He finished the presentation with enough time to take some questions.", 
        answer: true 
      }
    ]
  };

  // B2 Design Presentation Task 2 - Phrase matching
  const b2DesignPresentationPhraseMatching = {
    title: "Task 2",
    instructions: "Write the useful phrases next to the tips.",
    phrases: [
      "I'd like to talk you through the following (three) points.",
      "As you can see … / You'll notice that …",
      "As you know, …",
      "I'd now like to tell you about …",
      "In summary, …",
      "Do you have any questions?",
      "Firstly, … / Next, …",
      "Finally, I'm going to talk to you about …"
    ],
    items: [
      {
        id: 1,
        text: "Refer to the audience's knowledge",
        answer: "As you know, …"
      },
      {
        id: 2,
        text: "Refer to what images you are showing",
        answer: "As you can see … / You'll notice that …"
      },
      {
        id: 3,
        text: "Tell them the structure of your presentation",
        answer: "I'd like to talk you through the following (three) points."
      },
      {
        id: 4,
        text: "Use signal words to help them follow you",
        answer: "Firstly, … / Next, …"
      },
      {
        id: 5,
        text: "Tell them when you're moving on",
        answer: "I'd now like to tell you about …"
      },
      {
        id: 6,
        text: "Show them when you're near the end",
        answer: "Finally, I'm going to talk to you about …"
      },
      {
        id: 7,
        text: "Tell them the main points one last time",
        answer: "In summary, …"
      },
      {
        id: 8,
        text: "Open up the discussion",
        answer: "Do you have any questions?"
      }
    ]
  };

  useEffect(() => {
    // Check if the user can take this assessment
    const checkAvailability = async () => {
      try {
        setLoading(true);
        const availabilityData = await listeningAssessmentService.checkAssessmentAvailability(level, language);
        setAssessmentAvailability(availabilityData);
        
        // If assessment is not available, show a message and set state to indicate unavailability
        if (availabilityData && !availabilityData.available) {
          setAssessmentUnavailable(true);
          setLoading(false);
          return;
        }
        
        // Continue loading questions if assessment is available
        loadQuestions();
      } catch (error) {
        console.error("Error checking assessment availability:", error);
        // Don't bypass the cooldown check on error
        // Set a default unavailable message so user can't take assessment when we can't confirm availability
        setAssessmentAvailability({
          available: false,
          message: 'Error checking assessment availability. Please try again later.',
          nextAvailableDate: new Date(Date.now() + 60000) // Set a short cooldown (1 minute) to allow retrying
        });
        setAssessmentUnavailable(true);
        setLoading(false);
      }
    };

    // Load questions based on language and level
    const loadQuestions = async () => {
      try {
        console.log(`Loading ${level} level listening assessment in ${language} language`);
        setLoading(true);
        const data = await CEFRService.getAssessmentData(level, language, 'listening');
        console.log("Loaded assessment data:", data);
        console.log("Questions from service:", data?.questions);
        setAssessmentData(data); // Set this first regardless of questions
        
        // Special handling for B2 level
        if (level === 'b2') {
          console.log("Special handling for B2 level");
          setHasPlayed(true); // Auto-start the assessment for B2 level
        }
        
        if (data && data.questions && data.questions.length > 0) {
          console.log("Questions found:", data.questions.length);
          setQuestions(data.questions);
          // Initialize answers array with appropriate size
          setAnswers(new Array(data.questions.length).fill(undefined));
          
          // Initialize classification answers if needed
          if (data.classificationTask) {
            const initialClassification = {};
            data.classificationTask.items.forEach(item => {
              initialClassification[item.id] = null;
            });
            setClassificationAnswers(initialClassification);
          }
          
          // Initialize categorization answers if needed
          if (data.categorization) {
            const initialCategorization = {};
            data.categorization.items.forEach(item => {
              initialCategorization[item.id] = null;
            });
            setCategorizationAnswers(initialCategorization);
          }
          
          // Initialize fill-in-the-blanks answers if needed
          if (data.fillBlanks) {
            const initialFillBlanks = {};
            data.fillBlanks.sentences.forEach(sentence => {
              initialFillBlanks[sentence.id] = "";
            });
            setFillBlanksAnswers(initialFillBlanks);
            // Initialize available words
            if (data.fillBlanks.options) {
              setAvailableWords(data.fillBlanks.options);
            }
          } else if (data.fillBlanksTask) {
            const initialFillBlanks = {};
            data.fillBlanksTask.sentences.forEach(sentence => {
              initialFillBlanks[sentence.id] = "";
            });
            setFillBlanksAnswers(initialFillBlanks);
            // Initialize available words
            if (data.fillBlanksTask.options) {
              setAvailableWords(data.fillBlanksTask.options);
            }
          }

          // Initialize true/false answers if needed
          if (data.trueFalseTask) {
            const initialTrueFalse = {};
            data.trueFalseTask.items.forEach(item => {
              initialTrueFalse[item.id] = null;
            });
            setTrueFalseAnswers(initialTrueFalse);
          }
          
          // Initialize phrase matching answers if needed
          if (data.phraseMatchingTask) {
            const initialPhraseMatching = {};
            data.phraseMatchingTask.items.forEach(item => {
              initialPhraseMatching[item.id] = "";
            });
            setPhraseMatchingAnswers(initialPhraseMatching);
          }
          
          // Initialize ordering answers array with appropriate size
          let orderingSize = 6; // Default A1 size
          if (level === 'a2' && data.orderingTask) {
            orderingSize = data.orderingTask.items.length;
          }
          setOrderingAnswers(new Array(orderingSize).fill(0));
          
          setLoading(false);
        } else {
          console.warn("No questions found in assessment data, using fallback");
          // Fallback to local data if service returns nothing
          const fallbackQuestions = getQuestionsByLevelAndLanguage(level, language);
          console.log("Fallback questions:", fallbackQuestions);
          setQuestions(fallbackQuestions);
          setAnswers(new Array(fallbackQuestions.length).fill(undefined));
          
          // Initialize available words for fill-in-the-blanks if applicable
          const fillBlanksTask = getFillBlanksTask();
          if (fillBlanksTask && fillBlanksTask.options) {
            setAvailableWords([...fillBlanksTask.options]);
          }

          // Initialize true/false answers if needed
          const trueFalseTask = getTrueFalseTask();
          if (trueFalseTask) {
            const initialTrueFalse = {};
            trueFalseTask.items.forEach(item => {
              initialTrueFalse[item.id] = null;
            });
            setTrueFalseAnswers(initialTrueFalse);
          }
          
          // Initialize phrase matching answers if needed
          const phraseMatchingTask = getPhraseMatchingTask();
          if (phraseMatchingTask) {
            const initialPhraseMatching = {};
            phraseMatchingTask.items.forEach(item => {
              initialPhraseMatching[item.id] = "";
            });
            setPhraseMatchingAnswers(initialPhraseMatching);
          }
          
          setLoading(false);
        }
      } catch (error) {
        console.error("Error loading questions:", error);
        // Fallback to local data on error
        const fallbackQuestions = getQuestionsByLevelAndLanguage(level, language);
        console.log("Error occurred, using fallback questions:", fallbackQuestions);
        setQuestions(fallbackQuestions);
        setAnswers(new Array(fallbackQuestions.length).fill(undefined));
        
        // Initialize available words for fill-in-the-blanks if applicable
        const fillBlanksTask = getFillBlanksTask();
        if (fillBlanksTask && fillBlanksTask.options) {
          setAvailableWords([...fillBlanksTask.options]);
        }
        
        // Initialize true/false answers if needed
        const trueFalseTask = getTrueFalseTask();
        if (trueFalseTask) {
          const initialTrueFalse = {};
          trueFalseTask.items.forEach(item => {
            initialTrueFalse[item.id] = null;
          });
          setTrueFalseAnswers(initialTrueFalse);
        }
        
        // Initialize phrase matching answers if needed
        const phraseMatchingTask = getPhraseMatchingTask();
        if (phraseMatchingTask) {
          const initialPhraseMatching = {};
          phraseMatchingTask.items.forEach(item => {
            initialPhraseMatching[item.id] = "";
          });
          setPhraseMatchingAnswers(initialPhraseMatching);
        }
        
        setLoading(false);
      }
    };

    // Start by checking availability
    checkAvailability();
  }, [level, language, onBack]);

  // Initialize audio element when it's loaded
  useEffect(() => {
    if (audioRef.current) {
      // Add loadedmetadata event listener to get audio duration
      const handleAudioLoaded = () => {
        // Set actual audio duration from the element
        if (audioRef.current) {
          console.log('Audio loaded successfully. Duration:', audioRef.current.duration);
          setAudioDuration(audioRef.current.duration || 60); // Default to 60 if duration is 0 or NaN
        }
      };
      
      const handleError = (error) => {
        console.error('Error loading audio:', error);
        // If there's an error loading the audio, use a fallback duration
        setAudioDuration(120);
        // Auto-start the assessment if audio fails
        setHasPlayed(true);
        
        // Special handling for B2 level to ensure it still shows tasks
        if (level === 'b2') {
          console.log("Automatically proceeding with B2 assessment tasks due to audio error");
          setTimeLeft(0);
        }
      };
      
      const handleTimeUpdate = () => {
        if (audioRef.current) {
          const currentTime = audioRef.current.currentTime || 0;
          const duration = audioRef.current.duration || 60;
          
          setAudioProgress(currentTime);
          // Update timeLeft based on current time
          setTimeLeft(Math.ceil(duration - currentTime));
        }
      };
      
      // Try to get duration immediately if already loaded
      if (audioRef.current.readyState >= 2) {
        setAudioDuration(audioRef.current.duration || 60);
      }
      
      audioRef.current.addEventListener('loadedmetadata', handleAudioLoaded);
      audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
      audioRef.current.addEventListener('durationchange', handleAudioLoaded);
      audioRef.current.addEventListener('error', handleError);
      
      // Store reference to current audio element for cleanup
      const audioElement = audioRef.current;
      
      return () => {
        // Use the stored reference and check if it's still valid
        if (audioElement) {
          audioElement.removeEventListener('loadedmetadata', handleAudioLoaded);
          audioElement.removeEventListener('timeupdate', handleTimeUpdate);
          audioElement.removeEventListener('durationchange', handleAudioLoaded);
          audioElement.removeEventListener('error', handleError);
        }
      };
    }
  }, [audioRef.current, level]);

  useEffect(() => {
    if (timeLeft !== null) {
      if (timeLeft === 0) {
        setIsPlaying(false);
        setHasPlayed(true);
        // Safely pause audio if it exists
        if (audioRef.current) {
          audioRef.current.pause();
        }
      } else {
        const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [timeLeft]);

  // Handle audio ending event
  useEffect(() => {
    const handleAudioEnd = () => {
      setIsPlaying(false);
      setHasPlayed(true);
      setTimeLeft(0);
    };

    if (audioRef.current) {
      // Store reference to current audio element for cleanup
      const audioElement = audioRef.current;
      audioElement.addEventListener('ended', handleAudioEnd);
      
      return () => {
        // Use the stored reference for cleanup
        if (audioElement) {
          audioElement.removeEventListener('ended', handleAudioEnd);
        }
      };
    }
  }, [audioRef.current]);

  const getQuestionsByLevelAndLanguage = (level, language) => {
    // In a real app, these would come from a database with actual audio files
    // For this demo, we'll provide text descriptions of what audio would contain
    
    const questionsByLevel = {
      'a1': [
        {
          id: 1,
          audioDescription: language === 'english' ? 
            'A simple conversation: "Hello, how are you?" "I\'m fine, thank you."' : 
            'Une conversation simple: "Bonjour, comment ça va?" "Je vais bien, merci."',
          question: language === 'english' ? 'How is the second person feeling?' : 'Comment se sent la deuxième personne?',
          options: language === 'english' ? 
            ['Happy', 'Sad', 'Angry', 'Fine'] : 
            ['Heureux', 'Triste', 'En colère', 'Bien'],
          correctAnswer: 3,
          duration: 5 // seconds the audio would play
        },
        {
          id: 2,
          audioDescription: language === 'english' ? 
            'A basic announcement: "The train to London will depart from platform 3 at 2:00 PM."' : 
            'Une annonce basique: "Le train pour Paris partira du quai 3 à 14h00."',
          question: language === 'english' ? 'What platform does the train depart from?' : 'De quel quai le train part-il?',
          options: language === 'english' ? 
            ['Platform 1', 'Platform 2', 'Platform 3', 'Platform 4'] : 
            ['Quai 1', 'Quai 2', 'Quai 3', 'Quai 4'],
          correctAnswer: 2,
          duration: 8
        },
        {
          id: 3,
          audioDescription: language === 'english' ? 
            'Weather forecast: "Today will be sunny with a high of 25 degrees."' : 
            'Prévisions météorologiques: "Aujourd\'hui sera ensoleillé avec un maximum de 25 degrés."',
          question: language === 'english' ? 'What will the weather be like today?' : 'Quel temps fera-t-il aujourd\'hui?',
          options: language === 'english' ? 
            ['Rainy', 'Sunny', 'Cloudy', 'Snowy'] : 
            ['Pluvieux', 'Ensoleillé', 'Nuageux', 'Neigeux'],
          correctAnswer: 1,
          duration: 6
        }
      ],
      'b1': [], // Removed all questions for B1 Mars assessment
      'b2': [], // No multiple choice questions for B2 Design Presentation assessment
      'c1': [
        {
          id: 1,
          audioDescription: language === 'english' ? 
            'Academic lecture excerpt: "The concept of neuroplasticity has fundamentally altered our understanding of brain development. Contrary to earlier beliefs that neural pathways become fixed in early childhood, contemporary research demonstrates that the brain maintains remarkable adaptability throughout life. This plasticity enables cognitive restructuring in response to environmental stimuli, traumatic events, or deliberate practice, though the rate and extent of adaptation diminishes with age."' : 
            'Extrait de conférence académique: "Le concept de neuroplasticité a fondamentalement modifié notre compréhension du développement cérébral. Contrairement aux croyances antérieures selon lesquelles les voies neuronales deviennent fixes dans la petite enfance, les recherches contemporaines démontrent que le cerveau maintient une adaptabilité remarquable tout au long de la vie. Cette plasticité permet une restructuration cognitive en réponse aux stimuli environnementaux, aux événements traumatiques ou à la pratique délibérée, bien que le taux et l\'étendue de l\'adaptation diminuent avec l\'âge."',
          question: language === 'english' ? 'What was the earlier belief about neural pathways?' : 'Quelle était la croyance antérieure concernant les voies neuronales?',
          options: language === 'english' ? 
            ['They could be easily changed at any age', 'They become fixed in early childhood', 'They only develop during adolescence', 'They remain completely unchanged throughout life'] : 
            ['Elles pouvaient être facilement modifiées à tout âge', 'Elles deviennent fixes dans la petite enfance', 'Elles ne se développent que pendant l\'adolescence', 'Elles restent complètement inchangées tout au long de la vie'],
          correctAnswer: 1,
          duration: 30
        },
        {
          id: 2,
          audioDescription: language === 'english' ? 
            'Economic analysis: "The phenomenon of quantitative easing, implemented by central banks following the 2008 financial crisis, represents an unconventional monetary policy designed to stimulate economic activity. By purchasing long-term securities from the open market, central banks increase the money supply and encourage lending and investment. Critics argue that such policies may lead to asset bubbles, currency devaluation, and increased wealth inequality, while proponents emphasize their role in preventing deflationary spirals during economic downturns."' : 
            'Analyse économique: "Le phénomène d\'assouplissement quantitatif, mis en œuvre par les banques centrales après la crise financière de 2008, représente une politique monétaire non conventionnelle conçue pour stimuler l\'activité économique. En achetant des titres à long terme sur le marché ouvert, les banques centrales augmentent la masse monétaire et encouragent les prêts et les investissements. Les critiques soutiennent que de telles politiques peuvent conduire à des bulles d\'actifs, à la dévaluation des devises et à l\'augmentation des inégalités de richesse, tandis que les partisans soulignent leur rôle dans la prévention des spirales déflationnistes pendant les ralentissements économiques."',
          question: language === 'english' ? 'What is one criticism of quantitative easing mentioned in the recording?' : 'Quelle est une critique de l\'assouplissement quantitatif mentionnée dans l\'enregistrement?',
          options: language === 'english' ? 
            ['It reduces economic growth', 'It creates too many jobs', 'It may lead to asset bubbles', 'It decreases the money supply'] : 
            ['Il réduit la croissance économique', 'Il crée trop d\'emplois', 'Il peut conduire à des bulles d\'actifs', 'Il diminue la masse monétaire'],
          correctAnswer: 2,
          duration: 35
        },
        {
          id: 3,
          audioDescription: language === 'english' 
            ? 'Literary podcast: "Magical realism as exemplified in Gabriel García Márquez\'s \'One Hundred Years of Solitude\' represents a narrative mode that seamlessly interweaves the mundane with the fantastical. Unlike pure fantasy, magical realism presents extraordinary elements within an otherwise realistic setting, often reflecting cultural contexts where the boundary between the mystical and the quotidian remains permeable. This technique enables authors to explore political realities, historical trauma, and cultural identities through a lens that transcends the limitations of strict realism."' 
            : 'Podcast littéraire: "Le réalisme magique tel qu\'illustré dans \'Cent ans de solitude\' de Gabriel García Márquez représente un mode narratif qui entrelace harmonieusement le quotidien et le fantastique. Contrairement à la pure fantaisie, le réalisme magique présente des éléments extraordinaires dans un cadre par ailleurs réaliste, reflétant souvent des contextes culturels où la frontière entre le mystique et le quotidien reste perméable. Cette technique permet aux auteurs d\'explorer les réalités politiques, les traumatismes historiques et les identités culturelles à travers une lentille qui transcende les limitations du réalisme strict."',
          question: language === 'english' ? 'How does magical realism differ from pure fantasy according to the recording?' : 'Comment le réalisme magique diffère-t-il de la pure fantaisie selon l\'enregistrement?',
          options: language === 'english' ? 
            ['It has more realistic characters', 'It presents extraordinary elements within a realistic setting', 'It was developed more recently', 'It focuses exclusively on political themes'] : 
            ['Il a des personnages plus réalistes', 'Il présente des éléments extraordinaires dans un cadre réaliste', 'Il a été développé plus récemment', 'Il se concentre exclusivement sur des thèmes politiques'],
          correctAnswer: 1,
          duration: 30
        }
      ]
    };
    
    // If level not found, default to A1 or closest available
    const levelQuestions = questionsByLevel[level] || questionsByLevel['a1'];
    
    // Create a deep copy to avoid state mutation issues
    return JSON.parse(JSON.stringify(levelQuestions));
  };

  const handleAnswer = (questionIndex, answerIndex) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = answerIndex;
    setAnswers(newAnswers);
  };

  const playAudio = () => {
    if (audioRef.current) {
      // For demo purposes, if no audio file is available, we'll simulate audio playback
      const assessmentAudioUrl = assessmentData?.audioUrl;
      const questionAudioUrl = questions[0]?.audioUrl;

      console.log("Audio URLs:", { 
        assessmentAudioUrl, 
        questionAudioUrl, 
        audioElement: audioRef.current
      });

      if (!assessmentAudioUrl && !questionAudioUrl) {
        console.log("No audio URL found, simulating playback");
        // Simulate a 90-second audio file for demo purposes
        setAudioDuration(90);
        setTimeLeft(90);
        setIsPlaying(true);
        setHasPlayed(true);
        
        // Create a timer to simulate audio progress
        const interval = setInterval(() => {
          setAudioProgress(prev => {
            const newProgress = prev + 1;
            setTimeLeft(90 - newProgress);
            
            if (newProgress >= 90) {
              clearInterval(interval);
              setIsPlaying(false);
              return 90;
            }
            return newProgress;
          });
        }, 1000);
        
        return;
      }
      
      // Real audio file exists, try to play it
      audioRef.current.play().then(() => {
        console.log("Audio playback started successfully");
        setIsPlaying(true);
        setHasPlayed(true);
        // Use the actual audio duration for countdown
        const audioDuration = Math.ceil(audioRef.current.duration) || 60;
        setAudioDuration(audioDuration);
        setTimeLeft(audioDuration);
      }).catch(error => {
        console.error("Error playing audio:", error);
        // Fallback to set duration if audio playback fails
        simulateAudioPlayback();
      });
    } else {
      console.warn("Audio element reference not available");
      // Fallback if audio element not available
      simulateAudioPlayback();
    }
  };

  // Function to simulate audio playback when real audio fails or is unavailable
  const simulateAudioPlayback = () => {
    // Use a default 90 second duration
    const simulatedDuration = 90;
    setAudioDuration(simulatedDuration);
    setTimeLeft(simulatedDuration);
    setIsPlaying(true);
    setHasPlayed(true);
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += 1;
      setAudioProgress(progress);
      setTimeLeft(simulatedDuration - progress);
      
      if (progress >= simulatedDuration) {
        clearInterval(interval);
      setIsPlaying(false);
      }
    }, 1000);
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const resumeAudio = () => {
    if (audioRef.current) {
      audioRef.current.play();
    setIsPlaying(true);
    }
  };

  const restartAudio = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      setIsPlaying(true);
      setTimeLeft(Math.ceil(audioRef.current.duration));
    }
  };

  const handleProgressChange = (e) => {
    const newTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setAudioProgress(newTime);
      setTimeLeft(Math.ceil(audioRef.current.duration - newTime));
    }
  };

  const getTranscript = () => {
    if (assessmentData && assessmentData.transcript) {
      return assessmentData.transcript;
    }
    
    if (level === 'a1') {
      return a1VoicemailTranscript;
    } else if (level === 'a2') {
      const assessmentId = getAssessmentId();
      if (assessmentId === 'morning-briefing') {
        return a2MorningBriefingTranscript;
      } else if (assessmentId === 'briefing') {
        return a2BriefingTranscript;
      }
    } else if (level === 'b1') {
      const assessmentId = getAssessmentId();
      if (assessmentId === 'mars') {
        return b1MarsTranscript;
      }
    } else if (level === 'b2') {
      const assessmentId = getAssessmentId();
      if (assessmentId === 'design-presentation') {
        return b2DesignPresentationTranscript;
      }
    }
    
    return "Transcript not available for this assessment.";
  };

  const getAssessmentId = () => {
    // Try to determine assessment ID from audio URL
    let url = '';
    if (questions && questions.length > 0 && questions[0].audioUrl) {
      url = questions[0].audioUrl;
    } else if (assessmentData && assessmentData.audioUrl) {
      url = assessmentData.audioUrl;
    }

    if (url) {
      if (url.includes('Morning_briefing')) {
        return 'morning-briefing';
      } else if (url.includes('Briefing')) {
        return 'briefing';
      } else if (url.includes('Student_discussion')) {
        return 'mars';
      } else if (url.includes('design_presentation') || url.includes('Design Presntaion')) {
        return 'design-presentation';
      }
    }
    return null;
  };

  const getOrderingTask = () => {
    if (assessmentData && assessmentData.orderingTask) {
      return assessmentData.orderingTask;
    }
    
    if (level === 'a1') {
      return a1VoicemailOrderingTask;
    } else if (level === 'a2') {
      const assessmentId = getAssessmentId();
      if (assessmentId === 'morning-briefing') {
        return a2MorningBriefingOrderingTask;
      }
    }
    
    return null; // No ordering task for this assessment
  };

  const getClassificationTask = () => {
    if (assessmentData && assessmentData.classificationTask) {
      return assessmentData.classificationTask;
    }
    
    if (level === 'a2') {
      const assessmentId = getAssessmentId();
      if (assessmentId === 'briefing') {
        return a2BriefingClassificationTask;
      }
    }
    
    return null; // No classification task for this assessment
  };

  const getCategorization = () => {
    if (assessmentData && assessmentData.categorization) {
      return assessmentData.categorization;
    }
    
    if (level === 'b1') {
      const assessmentId = getAssessmentId();
      if (assessmentId === 'mars') {
        return b1MarsCategorization;
      }
    }
    
    return null; // No categorization task for this assessment
  };

  const getFillBlanksTask = () => {
    if (assessmentData && assessmentData.fillBlanks) {
      return assessmentData.fillBlanks;
    }
    
    if (assessmentData && assessmentData.fillBlanksTask) {
      return assessmentData.fillBlanksTask;
    }
    
    if (level === 'b1') {
      const assessmentId = getAssessmentId();
      if (assessmentId === 'mars') {
        return b1MarsFillBlanks;
      }
    }
    
    return null; // No fill blanks task for this assessment
  };

  const getTrueFalseTask = () => {
    if (assessmentData && assessmentData.trueFalseTask) {
      return assessmentData.trueFalseTask;
    }
    
    if (level === 'b2') {
      const assessmentId = getAssessmentId();
      if (assessmentId === 'design-presentation') {
        return b2DesignPresentationTrueFalse;
      }
    }
    
    return null; // No true/false task for this assessment
  };

  const getPhraseMatchingTask = () => {
    if (assessmentData && assessmentData.phraseMatchingTask) {
      return assessmentData.phraseMatchingTask;
    }
    
    if (level === 'b2') {
      const assessmentId = getAssessmentId();
      if (assessmentId === 'design-presentation') {
        return b2DesignPresentationPhraseMatching;
      }
    }
    
    return null; // No phrase matching task for this assessment
  };

  const calculateScore = () => {
    let correct = 0;
    
    answers.forEach((answer, index) => {
      if (index < questions.length && answer === questions[index].correctAnswer) {
        correct++;
      }
    });
    
    const percentage = (correct / questions.length) * 100;
    
    return {
      correct,
      percentage
    };
  };

  const calculateOrderingScore = () => {
    let correct = 0;
    const orderingTask = getOrderingTask();
    
    if (!orderingTask) return { correct: 0, percentage: 0 };
    
    const correctOrder = orderingTask.correctOrder;
    
    orderingAnswers.forEach((answer, index) => {
      if (index < correctOrder.length && answer === correctOrder[index]) {
        correct++;
      }
    });
    
    const percentage = (correct / orderingTask.items.length) * 100;
    
    return {
      correct,
      percentage
    };
  };

  const calculateClassificationScore = () => {
    let correct = 0;
    const classificationTask = getClassificationTask();
    
    if (!classificationTask) return { correct: 0, percentage: 0 };
    
    // Check each item's classification
    Object.entries(classificationAnswers).forEach(([itemId, categoryId]) => {
      if (categoryId) {
        const item = parseInt(itemId);
        // Find the category that should contain this item
        const correctCategory = classificationTask.categories.find(cat => 
          cat.correctItems.includes(item)
        );
        
        if (correctCategory && correctCategory.id === categoryId) {
          correct++;
        }
      }
    });
    
    const totalItems = classificationTask.items.length;
    const percentage = (correct / totalItems) * 100;
    
    return {
      correct,
      percentage
    };
  };

  const calculateCategorizationScore = () => {
    let correct = 0;
    const categorization = getCategorization();
    
    if (!categorization) return { correct: 0, percentage: 0 };
    
    // Check each item's categorization
    Object.entries(categorizationAnswers).forEach(([itemId, categoryId]) => {
      if (categoryId) {
        const item = parseInt(itemId);
        // Find the category that should contain this item
        const correctCategory = categorization.categories.find(cat => 
          cat.correctItems.includes(item)
        );
        
        if (correctCategory && correctCategory.id === categoryId) {
          correct++;
        }
      }
    });
    
    const totalItems = categorization.items.length;
    const percentage = (correct / totalItems) * 100;
    
    return {
      correct,
      percentage
    };
  };

  const calculateFillBlanksScore = () => {
    let correct = 0;
    const fillBlanksTask = getFillBlanksTask();
    
    if (!fillBlanksTask) return { correct: 0, percentage: 0 };
    
    // Check each fill-in-the-blank answer
    Object.entries(fillBlanksAnswers).forEach(([sentenceId, answer]) => {
      const sentence = fillBlanksTask.sentences.find(s => s.id === parseInt(sentenceId));
      if (sentence && answer.trim().toLowerCase() === sentence.answer.toLowerCase()) {
        correct++;
      }
    });
    
    const totalItems = fillBlanksTask.sentences.length;
    const percentage = (correct / totalItems) * 100;
    
    return {
      correct,
      percentage
    };
  };

  // Handle changes to the ordering task
  const handleOrderingChange = (index, value) => {
    // Only allow numbers 1-6
    if (value < 1 || value > 6) return;
    
    const newOrdering = [...orderingAnswers];
    newOrdering[index] = value;
    setOrderingAnswers(newOrdering);
  };

  // Handle changes to the classification task
  const handleClassificationChange = (itemId, categoryId) => {
    setClassificationAnswers(prev => ({
      ...prev,
      [itemId]: categoryId
    }));
  };

  // Handle changes to the categorization task
  const handleCategorizationChange = (itemId, categoryId) => {
    setCategorizationAnswers(prev => ({
      ...prev,
      [itemId]: categoryId
    }));
  };

  // Handle changes to the fill-in-the-blanks task
  const handleFillBlanksChange = (sentenceId, answer) => {
    setFillBlanksAnswers(prev => ({
      ...prev,
      [sentenceId]: answer
    }));
  };
  
  // Handle drag start for fill-in-the-blanks
  const handleDragStart = (e, word) => {
    e.dataTransfer.setData('text/plain', word);
  };
  
  // Handle drag over for fill-in-the-blanks
  const handleDragOver = (e) => {
    e.preventDefault();
  };
  
  // Handle drop for fill-in-the-blanks
  const handleDrop = (e, sentenceId) => {
    e.preventDefault();
    const word = e.dataTransfer.getData('text/plain');
    
    // Check if word is already used somewhere else
    const existingSentenceId = Object.entries(fillBlanksAnswers).find(
      ([id, answer]) => answer === word
    )?.[0];
    
    // If word is already used, remove it from the previous sentence
    if (existingSentenceId) {
      setFillBlanksAnswers(prev => ({
        ...prev,
        [existingSentenceId]: ""
      }));
    }
    
    // Set the word in the current sentence
    handleFillBlanksChange(sentenceId, word);
  };
  
  // Check if a word is currently used in any sentence
  const isWordUsed = (word) => {
    return Object.values(fillBlanksAnswers).includes(word);
  };
  
  // Clear a specific answer in fill-in-the-blanks
  const clearFillBlankAnswer = (sentenceId) => {
    handleFillBlanksChange(sentenceId, "");
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds === null) seconds = 0;
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const allQuestionsAnswered = () => {
    const mcqAnswered = answers.every(answer => answer !== undefined);
    
    // Check if ordering task is complete (if it exists)
    const orderingTask = getOrderingTask();
    const orderingComplete = !orderingTask || 
      orderingAnswers.slice(0, orderingTask.items.length).every(answer => answer > 0);
    
    // Check if classification task is complete (if it exists)
    const classificationTask = getClassificationTask();
    const classificationComplete = !classificationTask || 
      Object.values(classificationAnswers).every(categoryId => categoryId !== null);
    
    // Check if categorization task is complete (if it exists)
    const categorization = getCategorization();
    const categorizationComplete = !categorization || 
      Object.values(categorizationAnswers).every(categoryId => categoryId !== null);
    
    // Check if fill-in-the-blanks task is complete (if it exists)
    const fillBlanksTask = getFillBlanksTask();
    const fillBlanksComplete = !fillBlanksTask || 
      Object.values(fillBlanksAnswers).every(answer => answer.trim() !== "");
    
    // Check if true/false task is complete (if it exists)
    const trueFalseTask = getTrueFalseTask();
    const trueFalseComplete = !trueFalseTask || 
      Object.values(trueFalseAnswers).every(answer => answer !== null);
    
    // Check if phrase matching task is complete (if it exists)
    const phraseMatchingTask = getPhraseMatchingTask();
    const phraseMatchingComplete = !phraseMatchingTask || 
      Object.values(phraseMatchingAnswers).every(answer => answer.trim() !== "");
    
    return mcqAnswered && orderingComplete && classificationComplete && 
           categorizationComplete && fillBlanksComplete && 
           trueFalseComplete && phraseMatchingComplete;
  };

  const handleSubmit = async () => {
    // Clean up audio resources first
    if (audioRef.current) {
      try {
        // Pause audio if playing
        if (!audioRef.current.paused) {
          audioRef.current.pause();
        }
        // Reset audio element
        audioRef.current.currentTime = 0;
        // Set src to empty to release resources
        audioRef.current.src = "";
      } catch (error) {
        console.error("Error cleaning up audio:", error);
      }
    }
    
    const score = calculateScore();
    let finalScore;
    let totalQuestions = questions.length;
    let totalScores = questions.length > 0 ? 1 : 0;
    let totalCorrect = score.correct;
    let totalPercentage = score.percentage;
    
    // Add ordering score if available
    const orderingTask = getOrderingTask();
    if (orderingTask) {
      const orderingScore = calculateOrderingScore();
      totalCorrect += orderingScore.correct;
      totalPercentage += orderingScore.percentage;
      totalQuestions += orderingTask.items.length;
      totalScores++;
    }
    
    // Add classification score if available
    const classificationTask = getClassificationTask();
    if (classificationTask) {
      const classificationScore = calculateClassificationScore();
      totalCorrect += classificationScore.correct;
      totalPercentage += classificationScore.percentage;
      totalQuestions += classificationTask.items.length;
      totalScores++;
    }
    
    // Add categorization score if available
    const categorization = getCategorization();
    if (categorization) {
      const categorizationScore = calculateCategorizationScore();
      totalCorrect += categorizationScore.correct;
      totalPercentage += categorizationScore.percentage;
      totalQuestions += categorization.items.length;
      totalScores++;
    }
    
    // Add fill-in-the-blanks score if available
    const fillBlanksTask = getFillBlanksTask();
    if (fillBlanksTask) {
      const fillBlanksScore = calculateFillBlanksScore();
      totalCorrect += fillBlanksScore.correct;
      totalPercentage += fillBlanksScore.percentage;
      totalQuestions += fillBlanksTask.sentences.length;
      totalScores++;
    }
    
    // Add true/false score if available
    const trueFalseTask = getTrueFalseTask();
    if (trueFalseTask) {
      const trueFalseScore = calculateTrueFalseScore();
      totalCorrect += trueFalseScore.correct;
      totalPercentage += trueFalseScore.percentage;
      totalQuestions += trueFalseTask.items.length;
      totalScores++;
    }
    
    // Add phrase matching score if available
    const phraseMatchingTask = getPhraseMatchingTask();
    if (phraseMatchingTask) {
      const phraseMatchingScore = calculatePhraseMatchingScore();
      totalCorrect += phraseMatchingScore.correct;
      totalPercentage += phraseMatchingScore.percentage;
      totalQuestions += phraseMatchingTask.items.length;
      totalScores++;
    }
    
    // Calculate final score as average of all task scores
    finalScore = {
      correct: totalCorrect,
      percentage: totalScores > 0 ? totalPercentage / totalScores : 0,
      totalQuestions: totalQuestions
    };

    const results = {
      type: 'listening',
      level: level,
      language: language,
      score: finalScore.percentage,
      correctAnswers: finalScore.correct,
      totalQuestions: finalScore.totalQuestions,
      cefr: CEFRService.calculateCEFRResult(finalScore.percentage, level),
      answers: answers,
      feedback: CEFRService.generateFeedback(finalScore.percentage, level, 'listening')
    };

    // Try to submit to backend
    try {
      // Prepare data for backend submission
      const submissionData = {
        level,
        language,
        score: finalScore.percentage,
        correctAnswers: finalScore.correct,
        totalQuestions: finalScore.totalQuestions,
        answers,
        feedback: results.feedback,
        // Add task-specific answers if available
        mcqAnswers: answers.reduce((acc, val, idx) => {
          acc[idx] = val;
          return acc;
        }, {}),
      };

      // Add optional task answers if available
      if (Object.keys(orderingAnswers).length > 0) {
        submissionData.orderingAnswers = orderingAnswers;
      }
      
      if (Object.keys(classificationAnswers).length > 0) {
        submissionData.classificationAnswers = classificationAnswers;
      }
      
      if (Object.keys(categorizationAnswers).length > 0) {
        submissionData.categorizationAnswers = categorizationAnswers;
      }
      
      if (Object.keys(fillBlanksAnswers).length > 0) {
        submissionData.fillBlanksAnswers = fillBlanksAnswers;
      }
      
      if (Object.keys(trueFalseAnswers).length > 0) {
        submissionData.trueFalseAnswers = trueFalseAnswers;
      }
      
      if (Object.keys(phraseMatchingAnswers).length > 0) {
        submissionData.phraseMatchingAnswers = phraseMatchingAnswers;
      }

      console.log('Submitting listening assessment to backend:', submissionData);
      
      // Submit to backend
      const response = await listeningAssessmentService.submitAssessment(submissionData);
      
      console.log('Backend submission response:', response);
      
      // If submission was successful, add assessment ID to results
      if (response.success && response.assessment) {
        results.assessmentId = response.assessment._id;
      }
    } catch (error) {
      console.error('Error submitting to backend:', error);
      // Continue with local completion even if backend submission fails
    }

    // Short timeout to ensure audio cleanup is complete before unmounting
    setTimeout(() => {
      onComplete(results);
    }, 0);
  };

  // Handle changes to the true/false task
  const handleTrueFalseChange = (itemId, answer) => {
    setTrueFalseAnswers(prev => ({
      ...prev,
      [itemId]: answer
    }));
  };

  // Handle changes to the phrase matching task
  const handlePhraseMatchingChange = (itemId, answer) => {
    setPhraseMatchingAnswers(prev => ({
      ...prev,
      [itemId]: answer
    }));
  };

  // Handle changes to the true/false task
  const calculateTrueFalseScore = () => {
    let correct = 0;
    const trueFalseTask = getTrueFalseTask();
    
    if (!trueFalseTask) return { correct: 0, percentage: 0 };
    
    // Check each true/false answer
    Object.entries(trueFalseAnswers).forEach(([itemId, answer]) => {
      if (answer !== null) {
        const item = trueFalseTask.items.find(i => i.id === parseInt(itemId));
        if (item && answer === item.answer) {
        correct++;
        }
      }
    });
    
    const totalItems = trueFalseTask.items.length;
    const percentage = (correct / totalItems) * 100;
    
    return {
      correct,
      percentage
    };
  };

  const calculatePhraseMatchingScore = () => {
    let correct = 0;
    const phraseMatchingTask = getPhraseMatchingTask();
    
    if (!phraseMatchingTask) return { correct: 0, percentage: 0 };
    
    // Check each phrase matching answer
    Object.entries(phraseMatchingAnswers).forEach(([itemId, answer]) => {
      if (answer) {
        const item = phraseMatchingTask.items.find(i => i.id === parseInt(itemId));
        if (item && answer.trim().toLowerCase() === item.answer.toLowerCase()) {
          correct++;
        }
      }
    });
    
    const totalItems = phraseMatchingTask.items.length;
    const percentage = (correct / totalItems) * 100;
    
    return {
      correct,
      percentage
    };
  };

  // Special handling for B2 level to ensure it always shows tasks
  useEffect(() => {
    if (level === 'b2') {
      console.log("Special handling for B2 level - auto-showing tasks");
      setHasPlayed(true);
    }
  }, [level]);

  // Handle drag start for phrase matching
  const handlePhraseDragStart = (e, phrase) => {
    e.dataTransfer.setData('text/plain', phrase);
  };
  
  // Handle drag over for phrase matching
  const handlePhraseDragOver = (e) => {
    e.preventDefault();
  };
  
  // Handle drop for phrase matching
  const handlePhraseDrop = (e, itemId) => {
    e.preventDefault();
    const phrase = e.dataTransfer.getData('text/plain');
    
    // Check if phrase is already used somewhere else
    const existingItemId = Object.entries(phraseMatchingAnswers).find(
      ([id, answer]) => answer === phrase
    )?.[0];
    
    // If phrase is already used, remove it from the previous item
    if (existingItemId) {
      setPhraseMatchingAnswers(prev => ({
        ...prev,
        [existingItemId]: ""
      }));
      
      setUsedPhrases(prev => {
        const updated = {...prev};
        delete updated[phrase];
        return updated;
      });
    }
    
    // Set the phrase in the current item
    handlePhraseMatchingChange(itemId, phrase);
    
    // Mark phrase as used
    setUsedPhrases(prev => ({
      ...prev,
      [phrase]: itemId
    }));
  };
  
  // Check if a phrase is currently used
  const isPhraseUsed = (phrase) => {
    return Object.keys(usedPhrases).includes(phrase);
  };
  
  // Clear a specific answer in phrase matching
  const clearPhraseAnswer = (itemId) => {
    const phrase = phraseMatchingAnswers[itemId];
    
    // Remove phrase from used phrases
    if (phrase) {
      setUsedPhrases(prev => {
        const updated = {...prev};
        delete updated[phrase];
        return updated;
      });
    }
    
    handlePhraseMatchingChange(itemId, "");
  };

  // Final cleanup of audio resources when component unmounts
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        try {
          // Pause audio if playing
          if (!audioRef.current.paused) {
            audioRef.current.pause();
          }
          // Remove src to release resources
          audioRef.current.src = "";
        } catch (error) {
          console.error("Error cleaning up audio on unmount:", error);
        }
      }
    };
  }, []);

  // If assessment is unavailable, show a message instead of the assessment
  if (assessmentUnavailable && assessmentAvailability) {
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
                You've already taken this listening assessment. Our system enforces a 7-day waiting period between assessment attempts to ensure meaningful progress tracking.
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
  }

  if (loading || (!questions && !assessmentData)) {
    return (
      <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#592538] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading assessment questions...</p>
          <p className="text-gray-400 text-sm mt-2">Level: {level}, Language: {language}</p>
          <p className="text-gray-400 text-sm mt-2">Debug: {JSON.stringify({hasQuestions: !!questions, questionCount: questions?.length || 0, hasAssessmentData: !!assessmentData})}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h2 className="text-2xl font-bold text-[#592538]">
            Listening Assessment - {level.toUpperCase()}
          </h2>
          <button 
            onClick={onBack}
            className="px-4 py-2 text-sm font-medium text-[#592538] rounded-lg border border-[#592538] hover:bg-[#592538] hover:text-white transition-colors"
          >
            Exit Assessment
          </button>
        </div>

        <div className="mb-8">
          <h3 className="text-xl font-medium mb-4 text-gray-800">
            {level === 'a1' ? 'A voicemail message' : 
             level === 'a2' && getAssessmentId() === 'morning-briefing' ? 'A morning briefing' : 
             level === 'a2' && getAssessmentId() === 'briefing' ? 'A briefing' : 
             level === 'b1' ? 'A student discussion about Mars and Earth' :
             level === 'b2' ? 'A design presentation' :
             level === 'c1' ? 'A job interview' :
             'Listening Assessment'}
          </h3>
          <div className="bg-gray-50 p-6 rounded-lg mb-6 border border-gray-200">
            <p className="text-gray-700 mb-4">
              {level === 'a1' 
                ? 'Listen to a voicemail message and answer the questions to practice your listening skills.'
                : level === 'a2' && getAssessmentId() === 'morning-briefing'
                ? 'Listen to a morning briefing at a restaurant and answer the questions to practice your listening skills.'
                : level === 'a2' && getAssessmentId() === 'briefing'
                ? 'Listen to a briefing at a workplace and answer the questions to practice your listening skills.'
                : level === 'b1'
                ? 'Listen to students discussing Mars and Earth, then complete the tasks to practice your listening skills.'
                : level === 'b2'
                ? 'Listen to a design presentation and complete the tasks to practice your listening skills.'
                : level === 'c1'
                ? 'Listen to a job interview and answer the questions to practice your listening skills.'
                : 'Listen to the audio and answer the questions to practice your listening skills.'}
            </p>
            
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              {/* Hidden audio element for playing the actual audio files */}
              <audio 
                ref={audioRef}
                preload="auto"
                className="hidden"
                onError={(e) => {
                  console.error("Audio failed to load:", e);
                  console.log("Audio element error details:", e.target.error);
                  setHasPlayed(true); // Allow assessment to continue even if audio fails
                  if (level === 'b2') {
                    console.log("B2 level - proceeding without audio");
                  }
                }}
              >
                {assessmentData && assessmentData.audioUrl && (
                  <source 
                    src={assessmentData.audioUrl} 
                    type="audio/mpeg"
                  />
                )}
                {questions && questions[0] && questions[0].audioUrl && (
                  <source 
                    src={questions[0].audioUrl} 
                    type="audio/mpeg"
                  />
                )}
                {level === 'b1' && (
                  <source 
                    src="/Listening/B1/LE_listening_B1_Student_discussion.mp3" 
                    type="audio/mpeg"
                  />
                )}
                {level === 'b2' && (
                  <source 
                    src="/Listening/B2/Design Presntaion/LE_listening_B2_A_design_presentation.mp3" 
                    type="audio/mpeg"
                  />
                )}
                {level === 'a1' && (
                  <source 
                    src="/Listening/A1/A Voice Message/LE_listening_A1_A_voicemail_message.mp3" 
                    type="audio/mpeg"
                  />
                )}
                {level === 'a2' && (
                  <source 
                    src="/Listening/A2/Briefing/LE_listening_A2_Briefing.mp3" 
                    type="audio/mpeg"
                  />
                )}
                Your browser does not support the audio element.
              </audio>

              <div className="flex flex-col items-center">
                {!hasPlayed ? (
                  <div className="text-center mb-6">
                    <p className="text-gray-700 mb-3">
                      Listen to the audio and complete the tasks below
                    </p>
                    <button
                      onClick={playAudio}
                      className="w-20 h-20 rounded-full bg-[#592538] text-white flex items-center justify-center hover:bg-[#6d2c44] transition-colors shadow-md"
                      aria-label="Play"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <p className="text-gray-500 text-sm mt-3">Click to start audio</p>
                  </div>
                ) : (
                  <div className="w-full max-w-lg bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        {!isPlaying ? (
                          <button
                            onClick={resumeAudio}
                            className="w-12 h-12 rounded-full bg-[#592538] text-white flex items-center justify-center hover:bg-[#6d2c44] transition-colors shadow-sm"
                            aria-label="Play"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                            </svg>
                          </button>
                        ) : (
                          <button
                            onClick={pauseAudio}
                            className="w-12 h-12 rounded-full bg-[#592538] text-white flex items-center justify-center hover:bg-[#6d2c44] transition-colors shadow-sm"
                            aria-label="Pause"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 00-1 1v2a1 1 0 002 0V9a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v2a1 1 0 002 0V9a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        )}
                        
                        <button
                          onClick={restartAudio}
                          className="w-10 h-10 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center hover:bg-gray-200 transition-colors shadow-sm"
                          aria-label="Restart"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                      
                      <div className="text-gray-700 text-sm font-medium px-3 py-1 bg-gray-100 rounded-lg">
                        {formatTime(audioProgress)} / {formatTime(audioDuration)}
                      </div>
                    </div>
                    
                    <div className="w-full">
                      <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="absolute top-0 left-0 h-full bg-[#592538]" 
                          style={{ width: `${(audioProgress / audioDuration) * 100}%` }}
                        ></div>
                        <input
                          type="range"
                          min="0"
                          max={audioDuration || 100}
                          value={audioProgress}
                          onChange={handleProgressChange}
                          className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                        />
                      </div>
                      
                      {isPlaying && (
                        <div className="w-full flex justify-between mt-4">
                          <div className="flex items-center space-x-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#592538]" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071a1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243a1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828a1 1 0 010-1.415z" clipRule="evenodd" />
                            </svg>
                            <span className="text-xs font-medium text-[#592538]">Now Playing</span>
                          </div>
                          <div className="text-xs font-medium px-2 py-1 bg-[#592538]/10 rounded-full text-[#592538]">
                            Time Remaining: {formatTime(timeLeft)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {hasPlayed && (
                  <div className="mt-4">
                    <button
                      onClick={() => setShowTranscript(!showTranscript)}
                      className="px-4 py-2 border border-[#592538] text-[#592538] rounded-lg hover:bg-[#592538]/5 transition-colors flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                      </svg>
                      {showTranscript ? 'Hide Transcript' : 'Show Transcript'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Transcript Section */}
          {showTranscript && (
            <div className="bg-gray-50 p-5 rounded-lg mb-8 border border-gray-200">
              <h4 className="font-medium text-lg mb-3 text-[#592538] flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
                Transcript
              </h4>
              <div className="whitespace-pre-wrap text-sm text-gray-700 font-mono p-4 bg-white rounded border border-gray-200 max-h-80 overflow-y-auto">
                {getTranscript()}
              </div>
            </div>
          )}

          {/* Assessment Tasks - Always visible regardless of audio played state */}
          {level !== 'b1' && level !== 'b2' && questions.length > 0 && !questions[0].question.includes("_hidden_question_") && (
            <div className="mb-8 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h4 className="font-medium text-lg mb-3 text-[#592538] flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                Task 1
              </h4>
              <p className="text-gray-700 mb-5 pl-7">Choose the best answer for each question.</p>

              <div className="space-y-6">
                {questions.map((question, questionIndex) => (
                  <div key={questionIndex} className="border border-gray-200 rounded-lg p-5 hover:border-gray-300 transition-colors">
                    <p className="text-[#592538] font-medium mb-4">{question.question}</p>
                    <div className="space-y-3 pl-2">
                      {question.options.map((option, optionIndex) => (
                        <div
                          key={optionIndex}
                          className={`p-3 border rounded-lg cursor-pointer transition-all ${
                            answers[questionIndex] === optionIndex
                              ? 'border-[#592538] bg-[#592538]/5 shadow-sm'
                              : 'border-gray-200 hover:border-[#592538]/30 hover:bg-gray-50'
                          }`}
                          onClick={() => handleAnswer(questionIndex, optionIndex)}
                        >
                          <div className="flex items-center">
                            <div className={`h-5 w-5 rounded-full mr-3 flex items-center justify-center border transition-colors ${
                              answers[questionIndex] === optionIndex
                                ? 'bg-[#592538] border-[#592538]'
                                : 'border-gray-400'
                            }`}>
                              {answers[questionIndex] === optionIndex && (
                                <div className="h-2 w-2 rounded-full bg-white"></div>
                              )}
                            </div>
                            <span className={answers[questionIndex] === optionIndex ? 'font-medium' : ''}>{option}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Task 2: Ordering */}
          {getOrderingTask() && (
            <div className="mb-8 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h4 className="font-medium text-lg mb-3 text-[#592538] flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                {getOrderingTask().title}
              </h4>
              <p className="text-gray-700 mb-5 pl-7">{getOrderingTask().instructions}</p>

              <div className="space-y-4 mb-6">
                {getOrderingTask().items.map((item, index) => (
                  <div key={item.id} className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors bg-gray-50">
                    <input 
                      type="number" 
                      min="1" 
                      max={getOrderingTask().items.length} 
                      value={orderingAnswers[index] || ''}
                      onChange={(e) => handleOrderingChange(index, parseInt(e.target.value) || 0)}
                      className="w-12 h-10 border border-gray-300 rounded-md text-center mr-4 focus:border-[#592538] focus:ring-[#592538] shadow-sm"
                    />
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Task 2: Classification */}
          {getClassificationTask() && (
            <div className="mb-8 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h4 className="font-medium text-lg mb-3 text-[#592538] flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                </svg>
                {getClassificationTask().title}
              </h4>
              <p className="text-gray-700 mb-5 pl-7">{getClassificationTask().instructions}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                  <h5 className="font-medium mb-4 text-gray-700 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                    </svg>
                    Phrases to classify:
                  </h5>
                  <div className="space-y-3">
                    {getClassificationTask().items.map(item => (
                      <div 
                        key={item.id}
                        className={`p-3 bg-white border rounded-lg cursor-pointer transition-all ${
                          classificationAnswers[item.id] 
                            ? 'border-[#592538] bg-[#592538]/5 shadow-sm' 
                            : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                        }`}
                        onClick={() => {
                          if (classificationAnswers[item.id]) {
                            handleClassificationChange(item.id, null);
                          }
                        }}
                      >
                        <div className="flex justify-between items-center">
                          <span>{item.text}</span>
                          {classificationAnswers[item.id] && (
                            <span className="text-xs font-medium px-2 py-1 rounded-full bg-[#592538]/10 text-[#592538]">
                              {getClassificationTask().categories.find(cat => cat.id === classificationAnswers[item.id])?.name}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col space-y-4">
                  {getClassificationTask().categories.map(category => (
                    <div key={category.id} className="bg-white p-4 rounded-lg border-2 border-[#592538]">
                      <h5 className="font-medium text-[#592538] mb-3 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5 5a3 3 0 015-2.236A3 3 0 0114.83 6H16a2 2 0 110 4h-5V9a1 1 0 10-2 0v1H4a2 2 0 110-4h1.17C5.06 5.687 5 5.35 5 5zm4 1V5a1 1 0 10-1 1h1zm3 0a1 1 0 10-1-1v1h1z" clipRule="evenodd" />
                          <path d="M9 11H3v5a2 2 0 002 2h4v-7zM11 18h4a2 2 0 002-2v-5h-6v7z" />
                        </svg>
                        {category.name}
                      </h5>
                      <div className="min-h-36 p-3 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        {getClassificationTask().items.filter(item => classificationAnswers[item.id] === category.id).map(item => (
                          <div key={item.id} className="mb-2 p-2 bg-white rounded border border-gray-200 flex justify-between items-center shadow-sm">
                            <span>{item.text}</span>
                            <button
                              onClick={() => handleClassificationChange(item.id, null)}
                              className="text-gray-500 hover:text-[#592538] transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                        ))}

                        <button 
                          onClick={() => {
                            // Find the first unassigned item
                            const unassignedItem = getClassificationTask().items.find(item => !classificationAnswers[item.id]);
                            if (unassignedItem) {
                              handleClassificationChange(unassignedItem.id, category.id);
                            }
                          }}
                          className="w-full mt-2 py-1 border border-dashed border-[#592538] text-sm text-[#592538] rounded hover:bg-[#592538]/5 transition-colors"
                        >
                          Drop item here
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Task 1: Categorization for B1 level */}
          {getCategorization() && (
            <div className="mb-8 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h4 className="font-medium text-lg mb-3 text-[#592538] flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                </svg>
                {getCategorization().title}
              </h4>
              <p className="text-gray-700 mb-5 pl-7">{getCategorization().instructions}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                  <h5 className="font-medium mb-4 text-gray-700 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                    </svg>
                    Characteristics to categorize:
                  </h5>
                  <div className="space-y-3">
                    {getCategorization().items.map(item => (
                      <div 
                        key={item.id}
                        className={`p-3 bg-white border rounded-lg cursor-pointer transition-all ${
                          categorizationAnswers[item.id] 
                            ? 'border-[#592538] bg-[#592538]/5 shadow-sm' 
                            : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                        }`}
                        onClick={() => {
                          if (categorizationAnswers[item.id]) {
                            handleCategorizationChange(item.id, null);
                          }
                        }}
                      >
                        <div className="flex justify-between items-center">
                          <span>{item.text}</span>
                          {categorizationAnswers[item.id] && (
                            <span className="text-xs font-medium px-2 py-1 rounded-full bg-[#592538]/10 text-[#592538]">
                              {getCategorization().categories.find(cat => cat.id === categorizationAnswers[item.id])?.name}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex flex-col space-y-4">
                  {getCategorization().categories.map(category => (
                    <div key={category.id} className="bg-white p-4 rounded-lg border-2 border-[#592538]">
                      <h5 className="font-medium text-[#592538] mb-3 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                        {category.name}
                      </h5>
                      <div className="min-h-36 p-3 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        {getCategorization().items.filter(item => categorizationAnswers[item.id] === category.id).map(item => (
                          <div key={item.id} className="mb-2 p-2 bg-white rounded border border-gray-200 flex justify-between items-center shadow-sm">
                            <span>{item.text}</span>
                            <button 
                              onClick={() => handleCategorizationChange(item.id, null)}
                              className="text-gray-500 hover:text-[#592538] transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                        ))}
          
                        <button
                          onClick={() => {
                            // Find the first unassigned item
                            const unassignedItem = getCategorization().items.find(item => !categorizationAnswers[item.id]);
                            if (unassignedItem) {
                              handleCategorizationChange(unassignedItem.id, category.id);
                            }
                          }}
                          className="w-full mt-2 py-1 border border-dashed border-[#592538] text-sm text-[#592538] rounded hover:bg-[#592538]/5 transition-colors"
                        >
                          Drop item here
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Task 2: Fill in the blanks */}
          {getFillBlanksTask() && (
            <div className="mb-8 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h4 className="font-medium text-lg mb-3 text-[#592538] flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
                {getFillBlanksTask().title}
              </h4>
              <p className="text-gray-700 mb-5 pl-7">{getFillBlanksTask().instructions}</p>

              <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 mb-6">
                <h5 className="font-medium mb-4 text-gray-700 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                  </svg>
                  Available words:
                </h5>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-center">
                  {getFillBlanksTask().options.map((word, index) => (
                    <div 
                      key={index} 
                      className={`p-2 text-lg font-medium border rounded-md cursor-grab transition-all ${
                        isWordUsed(word) 
                          ? 'opacity-50 bg-gray-100 border-gray-300' 
                          : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm'
                      }`}
                      draggable={!isWordUsed(word)}
                      onDragStart={(e) => handleDragStart(e, word)}
                    >
                      {word}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-5">
                {getFillBlanksTask().sentences.map((sentence, index) => {
                  // Split the sentence text at the blank marker
                  const parts = sentence.text.split('________');
                  
                  return (
                    <div key={sentence.id} className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                      <span className="text-lg font-medium text-[#592538] mr-2">{index + 1}.</span>
                      <div className="flex flex-wrap items-center">
                        <span className="text-lg">{parts[0]}</span>
                        <div 
                          className={`w-40 h-10 mx-2 border-b-2 border-dashed flex items-center justify-center transition-colors ${
                            fillBlanksAnswers[sentence.id] ? 'border-[#592538]' : 'border-gray-400'
                          }`}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, sentence.id)}
                        >
                          {fillBlanksAnswers[sentence.id] ? (
                            <div className="flex items-center justify-between w-full px-2">
                              <span className="font-medium text-[#592538]">{fillBlanksAnswers[sentence.id]}</span>
                              <button
                                onClick={() => clearFillBlankAnswer(sentence.id)}
                                className="text-gray-400 hover:text-[#592538] transition-colors"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">Drag word here</span>
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

          {/* Task 1: True/False for B2 level */}
          {getTrueFalseTask() && (
            <div className="mb-8 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h4 className="font-medium text-lg mb-3 text-[#592538] flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {getTrueFalseTask().title}
              </h4>
              <p className="text-gray-700 mb-5 pl-7">{getTrueFalseTask().instructions}</p>

              <div className="space-y-4">
                {getTrueFalseTask().items.map((item) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                    <div className="flex justify-between items-center flex-wrap gap-4">
                      <p className="text-[#592538] font-medium">{item.id}. {item.text}</p>
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleTrueFalseChange(item.id, true)}
                          className={`px-5 py-2 rounded-md transition-all ${
                            trueFalseAnswers[item.id] === true
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
                          onClick={() => handleTrueFalseChange(item.id, false)}
                          className={`px-5 py-2 rounded-md transition-all ${
                            trueFalseAnswers[item.id] === false
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

          {/* Task 2: Phrase Matching for B2 level */}
          {getPhraseMatchingTask() && (
            <div className="mb-8 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h4 className="font-medium text-lg mb-3 text-[#592538] flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 2V5h1v1H5zM3 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zm2 2v-1h1v1H5zM13 3a1 1 0 00-1 1v3a1 1 0 001 1h3a1 1 0 001-1V4a1 1 0 00-1-1h-3zm1 2v1h1V5h-1z" clipRule="evenodd" />
                  <path d="M11 4a1 1 0 10-2 0v1a1 1 0 002 0V4zM10 7a1 1 0 011 1v1h2a1 1 0 110 2h-3a1 1 0 01-1-1V8a1 1 0 011-1zM16 9a1 1 0 100 2 1 1 0 000-2zM9 13a1 1 0 011-1h1a1 1 0 110 2v2a1 1 0 11-2 0v-3zM7 11a1 1 0 100-2H4a1 1 0 100 2h3zM17 13a1 1 0 01-1 1h-2a1 1 0 110-2h2a1 1 0 011 1zM16 17a1 1 0 100-2h-3a1 1 0 100 2h3z" />
                </svg>
                {getPhraseMatchingTask().title}
              </h4>
              <p className="text-gray-700 mb-5 pl-7">{getPhraseMatchingTask().instructions}</p>
              
              <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 mb-6">
                <h5 className="font-medium mb-4 text-gray-700 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" />
                  </svg>
                  Available phrases:
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-center">
                  {getPhraseMatchingTask().phrases.map((phrase, index) => (
                    <div 
                      key={index} 
                      className={`p-3 text-sm font-medium border rounded-md cursor-grab transition-all ${
                        isPhraseUsed(phrase) 
                          ? 'opacity-50 bg-gray-100 border-gray-300' 
                          : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm'
                      }`}
                      draggable={!isPhraseUsed(phrase)}
                      onDragStart={(e) => handlePhraseDragStart(e, phrase)}
                    >
                      {phrase}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-5">
                {getPhraseMatchingTask().items.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                    <span className="text-lg font-medium text-[#592538] pt-1">{item.id}.</span>
                    <div className="flex-1">
                      <p className="mb-3">{item.text}</p>
                      <div 
                        className={`h-12 border-2 border-dashed flex items-center px-3 rounded-md transition-colors ${
                          phraseMatchingAnswers[item.id] ? 'border-[#592538] bg-[#592538]/5' : 'border-gray-400'
                        }`}
                        onDragOver={handlePhraseDragOver}
                        onDrop={(e) => handlePhraseDrop(e, item.id)}
                      >
                        {phraseMatchingAnswers[item.id] ? (
                          <div className="flex items-center justify-between w-full">
                            <span className="font-medium text-[#592538]">{phraseMatchingAnswers[item.id]}</span>
                            <button
                              onClick={() => clearPhraseAnswer(item.id)}
                              className="text-gray-400 hover:text-[#592538] transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">Drag phrase here</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="mt-8 flex justify-center">
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

export default ListeningAssessment; 