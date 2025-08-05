const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || null,
    port: parseInt(process.env.DB_PORT || '3306'),
    database: process.env.DB_NAME || 'banana_db'
};

async function testCustomerDocumentsAPI() {
    let connection;

    try {
        // Connect to MySQL database
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to MySQL database');

        // Test 1: Check if documents_acknowledged column exists
        console.log('\n🔍 Test 1: Checking if documents_acknowledged column exists...');
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'registrations' 
            AND COLUMN_NAME = 'documents_acknowledged'
        `, [dbConfig.database]);

        if (columns.length > 0) {
            console.log('✅ documents_acknowledged column exists');
        } else {
            console.log('❌ documents_acknowledged column does not exist');
        }

        // Test 2: Get a sample registration to test with
        console.log('\n🔍 Test 2: Getting a sample registration...');
        const [registrations] = await connection.execute('SELECT id, company_name FROM registrations LIMIT 1');

        if (registrations.length === 0) {
            console.log('❌ No registrations found in database');
            return;
        }

        const testRegistration = registrations[0];
        console.log(`✅ Using registration: ${testRegistration.company_name} (${testRegistration.id})`);

        // Test 3: Test customer documents API by directly updating database
        console.log('\n🔍 Test 3: Testing customer documents update...');

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

        // Update the registration with test customer documents
        const [updateResult] = await connection.execute(
            `UPDATE registrations SET 
                customer_form1 = ?,
                customer_letter_of_engagement = ?,
                customer_aoa = ?,
                customer_form18 = ?,
                customer_address_proof = ?,
                documents_acknowledged = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`,
            [
                JSON.stringify(testCustomerDocuments.form1),
                JSON.stringify(testCustomerDocuments.letterOfEngagement),
                JSON.stringify(testCustomerDocuments.aoa),
                JSON.stringify(testCustomerDocuments.form18),
                JSON.stringify(testCustomerDocuments.addressProof),
                true,
                testRegistration.id
            ]
        );

        console.log('✅ Test customer documents updated successfully');

        // Test 4: Verify the update worked
        console.log('\n🔍 Test 4: Verifying the update...');
        const [verifyResult] = await connection.execute(
            `SELECT customer_form1, customer_letter_of_engagement, customer_aoa, 
                    customer_form18, customer_address_proof, documents_acknowledged
             FROM registrations WHERE id = ?`,
            [testRegistration.id]
        );

        if (verifyResult.length > 0) {
            const row = verifyResult[0];
            console.log('✅ Customer documents saved successfully:');
            console.log(`  - Form 1: ${row.customer_form1 ? '✅' : '❌'}`);
            console.log(`  - Letter of Engagement: ${row.customer_letter_of_engagement ? '✅' : '❌'}`);
            console.log(`  - AOA: ${row.customer_aoa ? '✅' : '❌'}`);
            console.log(`  - Form 18: ${row.customer_form18 ? '✅' : '❌'}`);
            console.log(`  - Address Proof: ${row.customer_address_proof ? '✅' : '❌'}`);
            console.log(`  - Documents Acknowledged: ${row.documents_acknowledged ? '✅' : '❌'}`);
        } else {
            console.log('❌ Failed to verify customer documents');
        }

        console.log('\n✅ Customer documents API test completed successfully');
    } catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('Database connection closed');
        }
    }
}

// Run test if this script is executed directly
if (require.main === module) {
    testCustomerDocumentsAPI()
        .then(() => {
            console.log('🎉 Test completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Test failed:', error);
            process.exit(1);
        });
}

module.exports = { testCustomerDocumentsAPI }; 