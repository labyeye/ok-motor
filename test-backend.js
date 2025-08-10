const axios = require('axios');

async function testBackend() {
  try {
    console.log('Testing backend connectivity...');
    
    // Test basic connectivity
    const healthResponse = await axios.get('https://ok-motor.onrender.com/health');
    console.log('Health check response:', healthResponse.status, healthResponse.data);
    
    // Test service bill preview endpoint (without auth for now)
    console.log('\nTesting service bill preview endpoint...');
    try {
      const previewResponse = await axios.post('https://ok-motor.onrender.com/api/service-bills/preview', {
        customerName: 'Test Customer',
        customerPhone: '1234567890',
        vehicleBrand: 'Test Brand',
        vehicleModel: 'Test Model',
        registrationNumber: 'TEST123',
        serviceItems: [
          {
            description: 'Test Service',
            quantity: 1,
            rate: 100
          }
        ],
        totalAmount: 100,
        taxRate: 18,
        discount: 0,
        advancePaid: 0
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log('Preview response status:', previewResponse.status);
      console.log('Preview response headers:', previewResponse.headers);
      console.log('Preview response data type:', typeof previewResponse.data);
      console.log('Preview response data length:', previewResponse.data?.length || 'N/A');
    } catch (error) {
      console.log('Preview endpoint error:', error.response?.status, error.response?.data);
    }
    
    // Test advance bill preview endpoint
    console.log('\nTesting advance bill preview endpoint...');
    try {
      const advancePreviewResponse = await axios.post('https://ok-motor.onrender.com/api/advance-bills/preview', {
        customerName: 'Test Customer',
        customerPhone: '1234567890',
        vehicleType: 'Bike',
        vehicleBrand: 'Test Brand',
        vehicleModel: 'Test Model',
        registrationNumber: 'TEST123',
        totalAmount: 100,
        advancePaid: 0
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log('Advance preview response status:', advancePreviewResponse.status);
      console.log('Advance preview response headers:', advancePreviewResponse.headers);
      console.log('Advance preview response data type:', typeof advancePreviewResponse.data);
      console.log('Advance preview response data length:', advancePreviewResponse.data?.length || 'N/A');
    } catch (error) {
      console.log('Advance preview endpoint error:', error.response?.status, error.response?.data);
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testBackend();
