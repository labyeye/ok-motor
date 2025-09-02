const https = require('https');

const testEndpoints = [
  'https://ok-motor-51l3.vercel.app/',
  'https://ok-motor-51l3.vercel.app/health',
  'https://ok-motor-51l3.vercel.app/test',
  'https://ok-motor-51l3.vercel.app/api/service-bills/debug'
];

async function testEndpoint(url) {
  return new Promise((resolve) => {
    const req = https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          url,
          status: res.statusCode,
          statusText: res.statusMessage,
          data: data.substring(0, 200) + (data.length > 200 ? '...' : '')
        });
      });
    });
    
    req.on('error', (error) => {
      resolve({
        url,
        error: error.message,
        status: 'ERROR'
      });
    });
    
    req.setTimeout(50000, () => {
      req.destroy();
      resolve({
        url,
        error: 'Request timeout',
        status: 'TIMEOUT'
      });
    });
  });
}

async function testAllEndpoints() {
  console.log('Testing Render backend endpoints...\n');
  
  for (const url of testEndpoints) {
    const result = await testEndpoint(url);
    console.log(`✅ ${url}`);
    console.log(`   Status: ${result.status || result.error}`);
    if (result.data) {
      console.log(`   Response: ${result.data}`);
    }
    console.log('');
  }
}

testAllEndpoints();
