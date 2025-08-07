// Test the API endpoint directly for step 4 additional documents upload
async function testAPIStep4Upload() {
    try {
        console.log('🧪 Testing API endpoint directly for step 4 additional documents upload...');

        // Use a known step 4 company ID
        const companyId = 'reg_1754589050780_mtrwwxrw0_0p4kx';

        console.log('📋 Using company ID:', companyId);

        // Step 1: Get current registration
        console.log('\n📤 Step 1: Getting current registration...');
        const getResponse = await fetch(`http://localhost:3000/api/registrations/${companyId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!getResponse.ok) {
            console.error('❌ Failed to get registration:', getResponse.status, getResponse.statusText);
            const errorText = await getResponse.text();
            console.error('Error details:', errorText);
            return;
        }

        const currentRegistration = await getResponse.json();
        console.log('✅ Got current registration successfully');
        console.log('📄 Current step4FinalAdditionalDoc:', currentRegistration.step4FinalAdditionalDoc);

        // Step 2: Create a new document
        console.log('\n📝 Step 2: Creating new document...');
        const newDocument = {
            name: 'api_test_document.pdf',
            type: 'application/pdf',
            size: 1024000,
            title: 'API Test Document',
            url: '/uploads/documents/api_test_document.pdf',
            filePath: 'documents/api_test_document.pdf',
            id: 'api-test-doc-' + Date.now(),
            uploadedAt: new Date().toISOString()
        };

        console.log('📄 New document:', newDocument);

        // Step 3: Add to existing documents
        console.log('\n📝 Step 3: Adding to existing documents...');
        const existingDocs = currentRegistration.step4FinalAdditionalDoc || [];
        const updatedDocs = [...existingDocs, newDocument];

        console.log('📄 Updated documents array:', updatedDocs);

        // Step 4: Update via API
        console.log('\n📤 Step 4: Updating via API...');
        const updateResponse = await fetch(`http://localhost:3000/api/registrations/${companyId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...currentRegistration,
                step4FinalAdditionalDoc: updatedDocs,
                updatedAt: new Date().toISOString(),
            })
        });

        console.log('📥 Update response status:', updateResponse.status);
        console.log('📥 Update response statusText:', updateResponse.statusText);

        if (!updateResponse.ok) {
            console.error('❌ Failed to update registration:', updateResponse.status, updateResponse.statusText);
            const errorText = await updateResponse.text();
            console.error('Error details:', errorText);
            return;
        }

        const updateResult = await updateResponse.json();
        console.log('✅ Update successful');
        console.log('📄 Update result:', updateResult);

        // Step 5: Verify the update
        console.log('\n📤 Step 5: Verifying the update...');
        const verifyResponse = await fetch(`http://localhost:3000/api/registrations/${companyId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!verifyResponse.ok) {
            console.error('❌ Failed to verify update:', verifyResponse.status, verifyResponse.statusText);
            return;
        }

        const verifiedRegistration = await verifyResponse.json();
        console.log('✅ Verification successful');
        console.log('📄 Verified step4FinalAdditionalDoc:', verifiedRegistration.step4FinalAdditionalDoc);

        // Check if our new document is there
        const newDocFound = verifiedRegistration.step4FinalAdditionalDoc?.find(doc => doc.title === 'API Test Document');
        if (newDocFound) {
            console.log('🎉 SUCCESS: New document found in database!');
            console.log('📄 Found document:', newDocFound);
        } else {
            console.log('❌ FAILED: New document not found in database');
        }

    } catch (error) {
        console.error('❌ Error in API test:', error);
    }
}

// Run the test
testAPIStep4Upload().then(() => {
    console.log('🏁 API test finished');
    process.exit(0);
}).catch((error) => {
    console.error('💥 API test failed:', error);
    process.exit(1);
});
