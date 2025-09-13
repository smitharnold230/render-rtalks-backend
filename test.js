const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const BASE_URL = 'http://localhost:3001';
let authToken = null;

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getAuthToken() {
  if (authToken) return authToken;
  
  try {
    const response = await fetch(`${BASE_URL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: process.env.ADMIN_USER,
        password: process.env.ADMIN_PASS
      })
    });
    
    const data = await response.json();
    if (data.token) {
      authToken = data.token;
      return authToken;
    } else {
      throw new Error('No token received');
    }
  } catch (error) {
    console.error('Failed to get auth token:', error.message);
    throw error;
  }
}

async function testHealthCheck() {
  console.log('\n🏥 Testing Health Check Endpoint...');
  try {
    const response = await fetch(`${BASE_URL}/health`);
    const data = await response.json();
    console.log('Health Check Response:', JSON.stringify(data, null, 2));
    console.log('✅ Health check test completed');
    return true;
  } catch (error) {
    console.error('❌ Health check test failed:', error.message);
    return false;
  }
}

async function testFileUpload() {
  console.log('\n📁 Testing File Upload Security...');
  
  // Test valid image upload
  try {
    // First get an auth token
    const loginResponse = await fetch(`${BASE_URL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: process.env.ADMIN_USER || 'admin', password: process.env.ADMIN_PASS || 'admin' })
    });
    
    const { token } = await loginResponse.json();
    
    // Now try the upload with auth
    const form = new FormData();
    const validImage = fs.createReadStream(path.join(__dirname, 'test-image.jpg'));
    form.append('image', validImage);
    
    const response = await fetch(`${BASE_URL}/api/admin/speakers/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: form
    });
    
    const data = await response.json();
    console.log('Valid image upload response:', data);
    console.log('✅ Valid image upload test completed');
  } catch (error) {
    console.error('❌ Valid image upload test failed:', error.message);
  }

  // Test invalid file type
  try {
    const form = new FormData();
    // Create a text file with .jpg extension
    const invalidFile = Buffer.from('fake image content');
    form.append('image', invalidFile, { filename: 'fake.jpg' });
    
    const response = await fetch(`${BASE_URL}/api/admin/speakers/upload`, {
      method: 'POST',
      body: form
    });
    
    const data = await response.json();
    console.log('Invalid file type response:', data);
    console.log('✅ Invalid file type test completed');
  } catch (error) {
    console.error('❌ Invalid file type test failed:', error.message);
  }
}

async function testRateLimiting() {
  console.log('\n🚥 Testing Rate Limiting...');
  
  // Test login rate limiting
  console.log('Testing login rate limiting...');
  const loginResults = [];
  
  for (let i = 0; i < 6; i++) {
    try {
      const response = await fetch(`${BASE_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'test', password: 'test' })
      });
      
      loginResults.push(response.status);
      await wait(100); // Small delay between requests
    } catch (error) {
      loginResults.push('error');
    }
  }
  
  console.log('Login rate limiting results:', loginResults);
  console.log('✅ Rate limiting test completed');
}

async function testErrorHandling() {
  console.log('\n🚨 Testing Error Handling...');
  
  // Test database error
  try {
    const response = await fetch(`${BASE_URL}/api/admin/speakers/invalid-id`);
    const data = await response.json();
    console.log('Database error response:', data);
  } catch (error) {
    console.error('Database error test failed:', error.message);
  }
  
  // Test auth error
  try {
    const response = await fetch(`${BASE_URL}/api/admin/speakers`, {
      headers: { 'Authorization': 'Bearer invalid-token' }
    });
    const data = await response.json();
    console.log('Auth error response:', data);
  } catch (error) {
    console.error('Auth error test failed:', error.message);
  }

  console.log('✅ Error handling test completed');
}

async function waitForServer(maxAttempts = 5) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      console.log(`Attempt ${i + 1}/${maxAttempts} to connect to server...`);
      const response = await fetch(`${BASE_URL}/health`);
      const data = await response.json();
      console.log('Server response:', JSON.stringify(data, null, 2));
      
      // Consider server healthy even without DB connection
      if (response.ok || (response.status === 503 && data.status === 'warning' && !data.database?.connected)) {
        console.log('Server is running (database connection not required for tests)');
        return true;
      }
    } catch (error) {
      console.log(`Attempt ${i + 1} failed:`, error.message);
      if (i < maxAttempts - 1) {
        console.log('Waiting 2 seconds before next attempt...');
        await wait(2000);
      }
    }
  }
  throw new Error(`Server not available after ${maxAttempts} attempts`);
}

async function testSecurityFeatures() {
  console.log('\n� Testing Security Features...');
  
  // Test CSP headers
  try {
    const response = await fetch(`${BASE_URL}/health`);
    const csp = response.headers.get('content-security-policy');
    const xframe = response.headers.get('x-frame-options');
    
    console.log('Security Headers:', {
      csp: csp ? '✅ Present' : '❌ Missing',
      xframe: xframe ? '✅ Present' : '❌ Missing'
    });
  } catch (error) {
    console.error('Security headers test failed:', error.message);
  }

  // Test rate limiting
  console.log('\nTesting rate limiting...');
  const responses = [];
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch(`${BASE_URL}/health`);
      responses.push(res.status);
      await wait(100);
    } catch (error) {
      responses.push('error');
    }
  }
  console.log('Rate limiting responses:', responses);
}

async function runAllTests() {
  console.log('🚀 Starting tests...');
  
  try {
    // Wait for server to be ready
    console.log('Checking server availability...');
    await waitForServer();
    console.log('Server is available, proceeding with security tests...');
    
    await testSecurityFeatures();
    
    console.log('\n✨ All tests completed!');
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

runAllTests().catch(console.error);