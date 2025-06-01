// test-prompt.js
import axios from 'axios';

const API_URL = 'http://localhost:5003/api';

async function testPromptGeneration() {
  try {
    console.log('Testing writing prompt generation...');
    
    // Test different levels
    const levels = ['a1', 'b1', 'c1'];
    const languages = ['english'];
    
    for (const level of levels) {
      for (const language of languages) {
        console.log(`\nTesting level: ${level}, language: ${language}`);
        
        try {
          const response = await axios.get(`${API_URL}/writing-assessment/generate-prompt?level=${level}&language=${language}`);
          
          if (response.data.success) {
            const prompt = response.data.prompt;
            console.log('Generated prompt:');
            console.log('Title:', prompt.title);
            console.log('Prompt:', prompt.prompt.substring(0, 100) + '...');
            console.log('Time limit:', prompt.timeLimit);
            console.log('Word limit:', prompt.wordLimit);
            console.log('Criteria:', prompt.criteria.join(', '));
          } else {
            console.error('API returned error:', response.data);
          }
        } catch (error) {
          console.error(`Error testing level ${level}:`, error.message);
        }
      }
    }
    
    console.log('\nTest completed!');
  } catch (error) {
    console.error('Error testing prompt generation:', error);
  }
}

testPromptGeneration(); 