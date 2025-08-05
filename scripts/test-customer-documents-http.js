const fetch = require('node-fetch');

async function testCustomerDocumentsHTTP() {
    try {
        console.log('🔍 Testing customer documents API via HTTP...');

        // Test data
        const testCustomerDocuments = {
            form1: {
                name: 'test-form1.pdf',
                type: 'application/pdf',
                size: 1024,
                url: '/uploads/documents/test-form1.pdf',
                id: 'test-form1-id',
                uploadedAt: new Date().toISOString(),
                signedByCustomer: true,
                submittedAt: new Date().toISOString()
            },
            letterOfEngagement: {
                name: 'test-letter.pdf',
                type: 'application/pdf',
                size: 2048,
                url: '/uploads/documents/test-letter.pdf',
                id: 'test-letter-id',
                uploadedAt: new Date().toISOString(),
                signedByCustomer: true,
                submittedAt: new Date().toISOString()
            },
            aoa: {
                name: 'test-aoa.pdf',
                type: 'application/pdf',
                size: 3072,
                url: '/uploads/documents/test-aoa.pdf',
                id: 'test-aoa-id',
                uploadedAt: new Date().toISOString(),
                signedByCustomer: true,
                submittedAt: new Date().toISOString()
            },
            form18: [
                {
                    name: 'test-form18-1.pdf',
                    type: 'application/pdf',
                    size: 1536,
                    url: '/uploads/documents/test-form18-1.pdf',
                    id: 'test-form18-1-id',
                    uploadedAt: new Date().toISOString(),
                    signedByCustomer: true,
                    submittedAt: new Date().toISOString()
                }
            ],
            addressProof: {
                name: 'test-address.pdf',
                type: 'application/pdf',
                size: 512,
                url: '/uploads/documents/test-address.pdf',
                id: 'test-address-id',
                uploadedAt: new Date().toISOString(),
                signedByCustomer: true,
                submittedAt: new Date().toISOString()
            }
        };

        const testRegistrationId = 'reg_1754308978698_7cztjd9fo_y0h9a'; // Use the existing registration ID

        const response = await fetch(`http://localhost:3000/api/registrations/${testRegistrationId}/customer-documents`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                customerDocuments: testCustomerDocuments,
                documentsAcknowledged: true
            })
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));

        if (response.ok) {
            const result = await response.json();
            console.log('✅ API call successful:', result);
        } else {
            const errorText = await response.text();
            console.error('❌ API call failed:', errorText);
        }

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Run test if this script is executed directly
if (require.main === module) {
    testCustomerDocumentsHTTP()
        .then(() => {
            console.log('🎉 HTTP test completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 HTTP test failed:', error);
            process.exit(1);
        });
}

module.exports = { testCustomerDocumentsHTTP }; 