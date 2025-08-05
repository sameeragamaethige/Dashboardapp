const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

async function testFrontendAPI() {
    try {
        console.log('🧪 Testing frontend API call simulation...');

        // Simulate the exact call that LocalStorageService.getRegistrations() makes
        console.log('\n1️⃣ Testing fetch to /api/registrations...');
        const response = await fetch('http://localhost:3000/api/registrations');

        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);

        if (!response.ok) {
            console.error('❌ Response not ok:', response.status, response.statusText);
            return;
        }

        const result = await response.json();
        console.log('\n2️⃣ Response type:', typeof result);
        console.log('Is Array:', Array.isArray(result));
        console.log('Result length:', Array.isArray(result) ? result.length : 'N/A');

        if (Array.isArray(result)) {
            console.log('✅ API returned array successfully');
            if (result.length > 0) {
                console.log('First item keys:', Object.keys(result[0]));
            }
        } else {
            console.error('❌ API returned non-array:', result);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Error details:', error);
    }
}

// Run test
testFrontendAPI(); 