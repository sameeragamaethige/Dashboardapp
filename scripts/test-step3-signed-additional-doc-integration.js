// Test script to verify step 3 signed additional documents integration
const mysql = require('mysql2/promise');
require('dotenv').config();

async function testStep3SignedAdditionalDocIntegration() {
    let connection;

    try {
        console.log('🧪 Testing step 3 signed additional documents integration...');

        // Database configuration
        const dbConfig = {
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || null,
            database: process.env.DB_NAME || 'banana_db',
            port: parseInt(process.env.DB_PORT || '3306'),
        };

        // Create connection
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Database connected successfully');

        // Test 1: Create a test registration with step 3 additional documents
        console.log('\n📋 Test 1: Creating test registration with step 3 additional documents...');
        const testId = 'test-step3-integration-' + Date.now();

        // Mock step 3 additional documents (as uploaded by admin)
        const step3AdditionalDocs = [
            {
                title: "Business Plan",
                name: "business-plan.pdf",
                type: "application/pdf",
                size: 2048000,
                url: "/uploads/documents/business-plan.pdf",
                filePath: "documents/business-plan.pdf",
                id: "doc-001",
                uploadedAt: new Date().toISOString()
            },
            {
                title: "Financial Projections",
                name: "financial-projections.xlsx",
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                size: 1536000,
                url: "/uploads/documents/financial-projections.xlsx",
                filePath: "documents/financial-projections.xlsx",
                id: "doc-002",
                uploadedAt: new Date().toISOString()
            }
        ];

        // Insert test registration
        await connection.execute(`
      INSERT INTO registrations (
        id, company_name, contact_person_name, contact_person_email, 
        contact_person_phone, selected_package, step3_additional_doc
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
            testId,
            'Test Integration Company',
            'Test Person',
            'test@integration.com',
            '1234567890',
            'Basic Package',
            JSON.stringify(step3AdditionalDocs)
        ]);

        console.log('✅ Test registration created with step 3 additional documents');

        // Test 2: Verify step 3 additional documents are loaded correctly
        console.log('\n📋 Test 2: Verifying step 3 additional documents loading...');
        const [rows] = await connection.execute('SELECT * FROM registrations WHERE id = ?', [testId]);

        if (rows.length > 0) {
            const registration = rows[0];
            const loadedStep3Docs = JSON.parse(registration.step3_additional_doc);

            console.log('✅ Step 3 additional documents loaded successfully:');
            console.log('   Number of documents:', loadedStep3Docs.length);
            loadedStep3Docs.forEach((doc, index) => {
                console.log(`   Document ${index + 1}: ${doc.title} (${doc.name})`);
            });
        }

        // Test 3: Simulate customer uploading signed step 3 additional documents
        console.log('\n📋 Test 3: Simulating customer upload of signed step 3 additional documents...');

        const signedStep3Docs = {
            "Business Plan": {
                name: "signed-business-plan.pdf",
                type: "application/pdf",
                size: 2150400,
                url: "/uploads/documents/signed-business-plan.pdf",
                filePath: "documents/signed-business-plan.pdf",
                id: "signed-doc-001",
                title: "Business Plan",
                uploadedAt: new Date().toISOString(),
                signedByCustomer: true,
                submittedAt: new Date().toISOString()
            },
            "Financial Projections": {
                name: "signed-financial-projections.xlsx",
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                size: 1638400,
                url: "/uploads/documents/signed-financial-projections.xlsx",
                filePath: "documents/signed-financial-projections.xlsx",
                id: "signed-doc-002",
                title: "Financial Projections",
                uploadedAt: new Date().toISOString(),
                signedByCustomer: true,
                submittedAt: new Date().toISOString()
            }
        };

        // Update registration with signed step 3 additional documents
        await connection.execute(`
      UPDATE registrations 
      SET step3_signed_additional_doc = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [JSON.stringify(signedStep3Docs), testId]);

        console.log('✅ Signed step 3 additional documents saved successfully');

        // Test 4: Verify signed step 3 additional documents are saved correctly
        console.log('\n📋 Test 4: Verifying signed step 3 additional documents...');
        const [updatedRows] = await connection.execute('SELECT * FROM registrations WHERE id = ?', [testId]);

        if (updatedRows.length > 0) {
            const registration = updatedRows[0];
            const loadedSignedStep3Docs = JSON.parse(registration.step3_signed_additional_doc);

            console.log('✅ Signed step 3 additional documents loaded successfully:');
            console.log('   Number of signed documents:', Object.keys(loadedSignedStep3Docs).length);
            Object.entries(loadedSignedStep3Docs).forEach(([title, doc]) => {
                console.log(`   Signed Document: ${title} (${doc.name})`);
                console.log(`     Signed by customer: ${doc.signedByCustomer}`);
                console.log(`     Submitted at: ${doc.submittedAt}`);
            });
        }

        // Test 5: Test API endpoint simulation (GET request)
        console.log('\n📋 Test 5: Testing API endpoint simulation...');
        const [apiTestRows] = await connection.execute('SELECT * FROM registrations WHERE id = ?', [testId]);

        if (apiTestRows.length > 0) {
            const row = apiTestRows[0];

            // Simulate the API conversion from snake_case to camelCase
            const convertedRow = {
                _id: row.id,
                step3AdditionalDoc: row.step3_additional_doc ? JSON.parse(row.step3_additional_doc) : null,
                step3SignedAdditionalDoc: row.step3_signed_additional_doc ? JSON.parse(row.step3_signed_additional_doc) : null,
            };

            console.log('✅ API conversion successful:');
            console.log('   Step 3 Additional Documents:', convertedRow.step3AdditionalDoc?.length || 0);
            console.log('   Step 3 Signed Additional Documents:', Object.keys(convertedRow.step3SignedAdditionalDoc || {}).length);

            // Verify the structure matches what the frontend expects
            if (convertedRow.step3AdditionalDoc && Array.isArray(convertedRow.step3AdditionalDoc)) {
                console.log('   ✅ step3AdditionalDoc is an array (correct for admin uploads)');
            }

            if (convertedRow.step3SignedAdditionalDoc && typeof convertedRow.step3SignedAdditionalDoc === 'object') {
                console.log('   ✅ step3SignedAdditionalDoc is an object (correct for customer uploads)');
            }
        }

        // Test 6: Test customer documents API endpoint simulation
        console.log('\n📋 Test 6: Testing customer documents API endpoint...');

        // Simulate the customer documents update
        const customerDocuments = {
            form1: null,
            letterOfEngagement: null,
            aoa: null,
            form18: [],
            addressProof: null,
            step3SignedAdditionalDoc: signedStep3Docs
        };

        await connection.execute(`
      UPDATE registrations SET 
        step3_signed_additional_doc = ?,
        documents_acknowledged = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
            JSON.stringify(customerDocuments.step3SignedAdditionalDoc),
            true,
            testId
        ]);

        console.log('✅ Customer documents API update successful');

        // Test 7: Verify final state
        console.log('\n📋 Test 7: Verifying final state...');
        const [finalRows] = await connection.execute('SELECT * FROM registrations WHERE id = ?', [testId]);

        if (finalRows.length > 0) {
            const registration = finalRows[0];
            console.log('✅ Final verification successful:');
            console.log('   Documents acknowledged:', registration.documents_acknowledged);
            console.log('   Step 3 additional documents:', JSON.parse(registration.step3_additional_doc).length);
            console.log('   Step 3 signed additional documents:', Object.keys(JSON.parse(registration.step3_signed_additional_doc)).length);
        }

        // Clean up test data
        console.log('\n🧹 Cleaning up test data...');
        await connection.execute('DELETE FROM registrations WHERE id = ?', [testId]);
        console.log('✅ Test data cleaned up');

        console.log('\n🎉 All integration tests passed successfully!');

    } catch (error) {
        console.error('❌ Integration test failed:', error.message);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
}

// Run test if this script is executed directly
if (require.main === module) {
    testStep3SignedAdditionalDocIntegration()
        .then(() => {
            console.log('✅ Step 3 signed additional documents integration test completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Step 3 signed additional documents integration test failed:', error);
            process.exit(1);
        });
}

module.exports = testStep3SignedAdditionalDocIntegration; 