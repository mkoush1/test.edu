// test-api.js
import axios from 'axios';

const API_URL = 'http://localhost:5003/api';

async function testApi() {
  try {
    console.log('Testing API endpoints...');
    
    // Test the basic test endpoint
    console.log('\nTesting /writing-assessment/test endpoint:');
    const testResponse = await axios.get(`${API_URL}/writing-assessment/test`);
    console.log('Test endpoint response:', testResponse.data);
    
    // Test the generate-prompt endpoint
    console.log('\nTesting /writing-assessment/generate-prompt endpoint:');
    const promptResponse = await axios.get(`${API_URL}/writing-assessment/generate-prompt?level=a1&language=english`);
    console.log('Generate prompt response:', {
      success: promptResponse.data.success,
      prompt: {
        title: promptResponse.data.prompt?.title,
        promptExcerpt: promptResponse.data.prompt?.prompt?.substring(0, 50) + '...',
        timeLimit: promptResponse.data.prompt?.timeLimit,
        wordLimit: promptResponse.data.prompt?.wordLimit,
        criteriaCount: promptResponse.data.prompt?.criteria?.length
      }
    });
    
    console.log('\nAPI tests completed successfully!');
  } catch (error) {
    console.error('Error testing API:', error);
    console.error('Error details:', {
      message: error.message,
      response: error.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      } : 'No response data'
    });
  }
}

testApi(); 