// test-openrouter.js
import axios from 'axios';

// OpenRouter API key
const OPENROUTER_API_KEY = "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";
const MODEL = "meta-llama/llama-3.3-8b-instruct:free";

async function testOpenRouter() {
  console.log("Testing OpenRouter API connection...");
  console.log(`Using model: ${MODEL}`);
  
  try {
    const response = await axios({
      method: 'post',
      url: 'https://openrouter.ai/api/v1/chat/completions',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://edusoft.com',
        'X-Title': 'EduSoft Test'
      },
      data: {
        model: MODEL,
        messages: [{ role: 'user', content: 'Say hello and confirm you are working!' }],
        temperature: 0.7,
        max_tokens: 100
      }
    });
    
    console.log("OpenRouter API Response Status:", response.status);
    console.log("Response Headers:", response.headers);
    console.log("Response Data:", {
      id: response.data.id,
      model: response.data.model,
      created: response.data.created,
      choices: response.data.choices?.map(choice => ({
        index: choice.index,
        message: {
          role: choice.message.role,
          content: choice.message.content
        }
      }))
    });
    
    console.log("\nSuccess! OpenRouter API is working correctly.");
    console.log("AI Response:", response.data.choices[0]?.message?.content);
    
  } catch (error) {
    console.error("Error testing OpenRouter API:", {
      message: error.message,
      response: error.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      } : 'No response data',
      request: error.request ? 'Request was made but no response received' : 'No request was made'
    });
  }
}

// Run the test
testOpenRouter(); 