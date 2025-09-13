const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  try {
    // 1. Test Health Check
    console.log('\n🏥 Testing Health Check...');
    const healthResponse = await fetch(`${BASE_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('Health Check Response:', JSON.stringify(healthData, null, 2));

    // 2. Test File Upload
    console.log('\n📁 Testing File Upload...');
    
    // Test valid image upload
    const form = new FormData();
    const imagePath = path.join(__dirname, 'test-image.jpg');
    form.append('image', fs.createReadStream(imagePath));
    
    const uploadResponse = await fetch(`${BASE_URL}/api/admin/speakers/1/image`, {
      method: 'POST',
      body: form,
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });
    console.log('Upload Response:', await uploadResponse.json());

    // 3. Test Rate Limiting
    console.log('\n🚦 Testing Rate Limiting...');
    const requests = Array(11).fill().map(() => 
      fetch(`${BASE_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'test', password: 'test' })
      })
    );
    
    const results = await Promise.all(requests);
    const lastResponse = await results[results.length - 1].json();
    console.log('Rate Limit Test:', lastResponse);

    // 4. Test Error Handling
    console.log('\n⚠️ Testing Error Handling...');
    
    // Test invalid file upload
    const invalidForm = new FormData();
    invalidForm.append('image', 'invalid data');
    
    const errorResponse = await fetch(`${BASE_URL}/api/admin/speakers/1/image`, {
      method: 'POST',
      body: invalidForm,
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });
    console.log('Error Response:', await errorResponse.json());

  } catch (error) {
    console.error('Test Error:', error.message);
  }
}

runTests();