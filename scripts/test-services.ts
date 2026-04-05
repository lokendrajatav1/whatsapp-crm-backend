import axios from 'axios';

const API_URL = 'http://localhost:5000/api';
let token = '';

async function testServices() {
  try {
    console.log('--- Testing Services API ---');

    // 1. Login to get token (assuming an admin user exists)
    // You might need to change these credentials
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'password123'
    });
    token = loginRes.data.token;
    console.log('✅ Logged in');

    const config = { headers: { Authorization: `Bearer ${token}` } };

    // 2. Create a service
    const createRes = await axios.post(`${API_URL}/services`, {
      name: 'Test Service',
      type: 'MONTHLY',
      basePrice: 5000,
      description: 'A test service description'
    }, config);
    const serviceId = createRes.data.id;
    console.log('✅ Service created:', createRes.data.name);

    // 3. Get all services
    const getRes = await axios.get(`${API_URL}/services`, config);
    console.log('✅ All services fetched, count:', getRes.data.length);

    // 4. Update service
    const updateRes = await axios.patch(`${API_URL}/services/${serviceId}`, {
      name: 'Updated Test Service',
      basePrice: 6000
    }, config);
    console.log('✅ Service updated:', updateRes.data.name, 'Price:', updateRes.data.basePrice);

    // 5. Delete service
    await axios.delete(`${API_URL}/services/${serviceId}`, config);
    console.log('✅ Service deleted');

    console.log('--- Services API Test Passed ---');
  } catch (error: any) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testServices();
