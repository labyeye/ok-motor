// Test script to verify server connectivity and CORS
const https = require('https');

const testEndpoints = [
  'https://ok-motor-51l3.vercel.app/health',
  'https://ok-motor-51l3.vercel.app/test',
  'https://ok-motor-51l3.vercel.app/api/service-bills/debug'
];

async function testEndpoint(url) {
  return new Promise((resolve) => {
    const req = https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          url,
          status: res.statusCode,
          headers: res.headers,
          data: data.substring(0, 200) + '...'
        });
      });
    });
    
    req.on('error', (error) => {
      resolve({
        url,
        error: error.message
      });
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      resolve({
        url,
        error: 'Request timeout'
      });
    });
  });
}

async function runTests() {
  console.log('Testing server connectivity...\n');
  
  for (const endpoint of testEndpoints) {
    console.log(`Testing: ${endpoint}`);
    const result = await testEndpoint(endpoint);
    
    if (result.error) {
      console.log(`❌ Error: ${result.error}\n`);
    } else {
      console.log(`✅ Status: ${result.status}`);
      console.log(`📋 CORS Headers:`, {
        'access-control-allow-origin': result.headers['access-control-allow-origin'],
        'access-control-allow-methods': result.headers['access-control-allow-methods'],
        'access-control-allow-headers': result.headers['access-control-allow-headers']
      });
      console.log(`📄 Response: ${result.data}\n`);
    }
  }
}

runTests();
