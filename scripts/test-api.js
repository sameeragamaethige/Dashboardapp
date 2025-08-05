const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

async function testAPI() {
    const baseUrl = 'http://localhost:3000/api';

    try {
        console.log('🧪 Testing API endpoints with new fields...');

        // Test 1: Create a test registration
        console.log('\n1️⃣ Testing POST /api/registrations...');
        const testRegistration = {
            id: 'api-test-' + Date.now(),
            companyName: 'API Test Company',
            contactPersonName: 'API Test Contact',
            contactPersonEmail: 'apitest@example.com',
            contactPersonPhone: '1234567890',
            selectedPackage: 'test-package',
            currentStep: 'company-details',
            status: 'payment-processing',
            // New fields
            dramaSedakaDivision: 'API Test Division',
            businessEmail: 'business@apitestcompany.com',
            businessContactNumber: '0987654321'
        };

        const createResponse = await fetch(`${baseUrl}/registrations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testRegistration)
        });

        if (createResponse.ok) {
            const createResult = await createResponse.json();
            console.log('✅ Registration created successfully:', createResult);
        } else {
            const errorText = await createResponse.text();
            console.error('❌ Failed to create registration:', errorText);
            return;
        }

        // Test 2: Get the registration by ID
        console.log('\n2️⃣ Testing GET /api/registrations/[id]...');
        const getResponse = await fetch(`${baseUrl}/registrations/${testRegistration.id}`);

        if (getResponse.ok) {
            const registration = await getResponse.json();
            console.log('✅ Registration retrieved successfully:');
            console.log(`   - Drama Sedaka Division: ${registration.dramaSedakaDivision}`);
            console.log(`   - Business Email: ${registration.businessEmail}`);
            console.log(`   - Business Contact Number: ${registration.businessContactNumber}`);
        } else {
            const errorText = await getResponse.text();
            console.error('❌ Failed to get registration:', errorText);
            return;
        }

        // Test 3: Update the registration
        console.log('\n3️⃣ Testing PUT /api/registrations/[id]...');
        const updateData = {
            ...testRegistration,
            dramaSedakaDivision: 'Updated API Division',
            businessEmail: 'updated@apitestcompany.com',
            businessContactNumber: '1111111111'
        };

        const updateResponse = await fetch(`${baseUrl}/registrations/${testRegistration.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData)
        });

        if (updateResponse.ok) {
            const updateResult = await updateResponse.json();
            console.log('✅ Registration updated successfully:', updateResult);
        } else {
            const errorText = await updateResponse.text();
            console.error('❌ Failed to update registration:', errorText);
            return;
        }

        // Test 4: Verify the update
        console.log('\n4️⃣ Verifying the update...');
        const verifyResponse = await fetch(`${baseUrl}/registrations/${testRegistration.id}`);

        if (verifyResponse.ok) {
            const updatedRegistration = await verifyResponse.json();
            console.log('✅ Updated registration verified:');
            console.log(`   - Drama Sedaka Division: ${updatedRegistration.dramaSedakaDivision}`);
            console.log(`   - Business Email: ${updatedRegistration.businessEmail}`);
            console.log(`   - Business Contact Number: ${updatedRegistration.businessContactNumber}`);
        } else {
            const errorText = await verifyResponse.text();
            console.error('❌ Failed to verify update:', errorText);
            return;
        }

        // Test 5: Get all registrations
        console.log('\n5️⃣ Testing GET /api/registrations...');
        const getAllResponse = await fetch(`${baseUrl}/registrations`);

        if (getAllResponse.ok) {
            const registrations = await getAllResponse.json();
            const testReg = registrations.find(r => r.id === testRegistration.id);
            if (testReg) {
                console.log('✅ Test registration found in all registrations:');
                console.log(`   - Drama Sedaka Division: ${testReg.dramaSedakaDivision}`);
                console.log(`   - Business Email: ${testReg.businessEmail}`);
                console.log(`   - Business Contact Number: ${testReg.businessContactNumber}`);
            } else {
                console.log('⚠️  Test registration not found in all registrations');
            }
        } else {
            const errorText = await getAllResponse.text();
            console.error('❌ Failed to get all registrations:', errorText);
        }

        // Test 6: Clean up - Delete the test registration
        console.log('\n6️⃣ Cleaning up test registration...');
        const deleteResponse = await fetch(`${baseUrl}/registrations/${testRegistration.id}`, {
            method: 'DELETE'
        });

        if (deleteResponse.ok) {
            console.log('✅ Test registration deleted successfully');
        } else {
            const errorText = await deleteResponse.text();
            console.error('❌ Failed to delete test registration:', errorText);
        }

        console.log('\n🎉 All API tests completed successfully!');

    } catch (error) {
        console.error('❌ API test failed:', error.message);
        console.log('\n💡 Make sure the development server is running on http://localhost:3000');
    }
}

// Run API tests
testAPI(); 