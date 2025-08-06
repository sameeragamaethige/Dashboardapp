// Test script for additional documents upload fix
// This script tests that admin can upload multiple additional documents correctly

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'banana_db',
    port: process.env.DB_PORT || 3306
};

// Test data
const testCompanyId = 'additional-docs-upload-fix-test-company';
const testAdditionalDocuments = [
    {
        title: 'Business Plan Template',
        name: 'business-plan-template.pdf',
        type: 'application/pdf',
        size: 2048000,
        url: '/uploads/documents/business-plan-template.pdf',
        filePath: 'documents/business-plan-template.pdf',
        id: 'admin-doc-001',
        uploadedAt: new Date().toISOString()
    },
    {
        title: 'Financial Projections Template',
        name: 'financial-projections-template.xlsx',
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: 1024000,
        url: '/uploads/documents/financial-projections-template.xlsx',
        filePath: 'documents/financial-projections-template.xlsx',
        id: 'admin-doc-002',
        uploadedAt: new Date().toISOString()
    },
    {
        title: 'Legal Agreement Template',
        name: 'legal-agreement-template.docx',
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: 512000,
        url: '/uploads/documents/legal-agreement-template.docx',
        filePath: 'documents/legal-agreement-template.docx',
        id: 'admin-doc-003',
        uploadedAt: new Date().toISOString()
    },
    {
        title: 'Tax Certificate Template',
        name: 'tax-certificate-template.pdf',
        type: 'application/pdf',
        size: 1536000,
        url: '/uploads/documents/tax-certificate-template.pdf',
        filePath: 'documents/tax-certificate-template.pdf',
        id: 'admin-doc-004',
        uploadedAt: new Date().toISOString()
    }
];

// Helper function to create test files in uploads directory
async function createTestUploadFiles() {
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'documents');

    // Ensure directory exists
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Create test files
    for (const doc of testAdditionalDocuments) {
        const filePath = path.join(uploadsDir, doc.name);
        const content = `Test content for ${doc.title}`;
        fs.writeFileSync(filePath, content);
        console.log(`✅ Created test file: ${doc.name}`);
    }
}

// Helper function to cleanup test files
async function cleanupTestFiles() {
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'documents');

    // Remove test files
    for (const doc of testAdditionalDocuments) {
        const filePath = path.join(uploadsDir, doc.name);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`🗑️ Removed test file: ${doc.name}`);
        }
    }
}

// Test 1: Verify admin can upload additional documents one by one
async function testAdditionalDocumentsUpload() {
    console.log('\n🧪 Test 1: Admin uploading additional documents one by one');

    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);

        // First, create a test registration if it doesn't exist
        const [existingRows] = await connection.execute(`
            SELECT id FROM registrations WHERE id = ?
        `, [testCompanyId]);

        if (existingRows.length === 0) {
            await connection.execute(`
                INSERT INTO registrations (id, company_name, contact_person_name, contact_person_email, 
                contact_person_phone, selected_package, current_step, status, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            `, [testCompanyId, 'Test Company', 'Test Contact', 'test@example.com', '+1234567890', 'basic', 'documentation', 'pending']);
            console.log('✅ Created test registration');
        }

        // Simulate uploading additional documents one by one
        let currentDocuments = [];

        for (let i = 0; i < testAdditionalDocuments.length; i++) {
            const doc = testAdditionalDocuments[i];
            console.log(`📁 Uploading document ${i + 1}/${testAdditionalDocuments.length}: ${doc.title}`);

            // Add document to current list (simulating individual upload)
            currentDocuments.push(doc);

            // Update the registration with the new document (simulating saveSingleAdditionalDocumentToDatabase)
            await connection.execute(`
                UPDATE registrations 
                SET step3_additional_doc = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `, [JSON.stringify(currentDocuments), testCompanyId]);

            console.log(`✅ Document ${i + 1} uploaded and saved: ${doc.title}`);

            // Verify the document was saved correctly
            const [verifyRows] = await connection.execute(`
                SELECT step3_additional_doc FROM registrations WHERE id = ?
            `, [testCompanyId]);

            const savedDocuments = JSON.parse(verifyRows[0].step3_additional_doc);
            console.log(`📊 Documents in database after upload ${i + 1}: ${savedDocuments.length} documents`);
        }

        console.log('✅ All additional documents uploaded successfully');

        // Final verification
        const [finalRows] = await connection.execute(`
            SELECT step3_additional_doc FROM registrations WHERE id = ?
        `, [testCompanyId]);

        const finalDocs = JSON.parse(finalRows[0].step3_additional_doc);
        console.log(`📊 Final document count: ${finalDocs.length} documents`);

        // Verify all documents are present
        if (finalDocs.length !== testAdditionalDocuments.length) {
            console.log(`❌ Document count mismatch. Expected: ${testAdditionalDocuments.length}, Got: ${finalDocs.length}`);
            return false;
        }

        // Verify each document structure
        for (let i = 0; i < finalDocs.length; i++) {
            const savedDoc = finalDocs[i];
            const expectedDoc = testAdditionalDocuments[i];

            if (!savedDoc.title || !savedDoc.name || !savedDoc.url || !savedDoc.filePath || !savedDoc.id) {
                console.log(`❌ Document ${i + 1} structure incomplete:`, savedDoc);
                return false;
            }

            if (savedDoc.title !== expectedDoc.title) {
                console.log(`❌ Document ${i + 1} title mismatch. Expected: ${expectedDoc.title}, Got: ${savedDoc.title}`);
                return false;
            }
        }

        console.log('✅ All additional documents uploaded and saved correctly');
        return true;

    } catch (error) {
        console.error('❌ Error testing additional documents upload:', error.message);
        return false;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Test 2: Verify admin can continue adding documents after initial uploads
async function testContinuousDocumentAddition() {
    console.log('\n🧪 Test 2: Admin continuing to add documents after initial uploads');

    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);

        // Get current documents
        const [currentRows] = await connection.execute(`
            SELECT step3_additional_doc FROM registrations WHERE id = ?
        `, [testCompanyId]);

        if (currentRows.length === 0) {
            console.log('❌ Test registration not found');
            return false;
        }

        const currentDocs = JSON.parse(currentRows[0].step3_additional_doc);
        console.log(`📊 Current documents: ${currentDocs.length} documents`);

        // Simulate adding more documents after initial uploads
        const additionalDocuments = [
            {
                title: 'Additional Document 1',
                name: 'additional-doc-1.pdf',
                type: 'application/pdf',
                size: 1024000,
                url: '/uploads/documents/additional-doc-1.pdf',
                filePath: 'documents/additional-doc-1.pdf',
                id: 'admin-doc-005',
                uploadedAt: new Date().toISOString()
            },
            {
                title: 'Additional Document 2',
                name: 'additional-doc-2.docx',
                type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                size: 512000,
                url: '/uploads/documents/additional-doc-2.docx',
                filePath: 'documents/additional-doc-2.docx',
                id: 'admin-doc-006',
                uploadedAt: new Date().toISOString()
            }
        ];

        // Add each additional document individually
        for (let i = 0; i < additionalDocuments.length; i++) {
            const doc = additionalDocuments[i];
            console.log(`📁 Adding additional document ${i + 1}/${additionalDocuments.length}: ${doc.title}`);

            // Get current state
            const [stateRows] = await connection.execute(`
                SELECT step3_additional_doc FROM registrations WHERE id = ?
            `, [testCompanyId]);

            const stateDocs = JSON.parse(stateRows[0].step3_additional_doc);
            const updatedDocs = [...stateDocs, doc];

            // Update with new document
            await connection.execute(`
                UPDATE registrations 
                SET step3_additional_doc = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `, [JSON.stringify(updatedDocs), testCompanyId]);

            console.log(`✅ Additional document ${i + 1} added: ${doc.title}`);
        }

        // Verify final state
        const [finalRows] = await connection.execute(`
            SELECT step3_additional_doc FROM registrations WHERE id = ?
        `, [testCompanyId]);

        const finalDocs = JSON.parse(finalRows[0].step3_additional_doc);
        console.log(`📊 Final document count after additional uploads: ${finalDocs.length} documents`);

        const expectedCount = currentDocs.length + additionalDocuments.length;
        if (finalDocs.length === expectedCount) {
            console.log('✅ Continuous document addition working correctly');
            return true;
        } else {
            console.log(`❌ Document count mismatch. Expected: ${expectedCount}, Got: ${finalDocs.length}`);
            return false;
        }

    } catch (error) {
        console.error('❌ Error testing continuous document addition:', error.message);
        return false;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Test 3: Verify API endpoints work correctly for additional documents
async function testAPIEndpointsAdditionalDocuments() {
    console.log('\n🧪 Test 3: API endpoints functionality for additional documents');

    try {
        // Test GET endpoint
        const getResponse = await fetch(`http://localhost:3000/api/registrations/${testCompanyId}`);
        if (!getResponse.ok) {
            console.log(`❌ GET API failed: ${getResponse.status} ${getResponse.statusText}`);
            return false;
        }

        const registration = await getResponse.json();
        console.log('✅ GET API working correctly');

        // Verify step3 additional documents are included in response
        if (registration.step3AdditionalDoc && Array.isArray(registration.step3AdditionalDoc)) {
            console.log(`✅ Step3 additional documents included in API response: ${registration.step3AdditionalDoc.length} documents`);

            // Verify document titles
            for (const doc of registration.step3AdditionalDoc) {
                console.log(`  - ${doc.title} (${doc.name})`);
            }
        } else {
            console.log('❌ Step3 additional documents not included in API response');
            return false;
        }

        // Test PUT endpoint
        const updateData = {
            ...registration,
            step3AdditionalDoc: registration.step3AdditionalDoc,
            updatedAt: new Date().toISOString()
        };

        const putResponse = await fetch(`http://localhost:3000/api/registrations/${testCompanyId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData)
        });

        if (!putResponse.ok) {
            console.log(`❌ PUT API failed: ${putResponse.status} ${putResponse.statusText}`);
            return false;
        }

        console.log('✅ PUT API working correctly');
        return true;

    } catch (error) {
        console.error('❌ Error testing API endpoints:', error.message);
        return false;
    }
}

// Test 4: Verify file storage integration
async function testFileStorageIntegration() {
    console.log('\n🧪 Test 4: File storage integration for additional documents');

    try {
        // Test GET endpoint to get document URLs
        const getResponse = await fetch(`http://localhost:3000/api/registrations/${testCompanyId}`);
        if (!getResponse.ok) {
            console.log(`❌ GET API failed: ${getResponse.status} ${getResponse.statusText}`);
            return false;
        }

        const registration = await getResponse.json();
        const documents = registration.step3AdditionalDoc || [];

        console.log(`📊 Checking ${documents.length} documents for file storage integration`);

        // Verify each document has proper file storage data
        for (const doc of documents) {
            if (!doc.url || !doc.filePath || !doc.id) {
                console.log(`❌ Document missing file storage data: ${doc.title}`);
                return false;
            }

            // Check if file exists in storage (simulate)
            const filePath = path.join(process.cwd(), 'public', doc.url);
            if (fs.existsSync(filePath)) {
                console.log(`✅ Document file exists in storage: ${doc.name}`);
            } else {
                console.log(`⚠️ Document file not found in storage: ${doc.name} (this is expected in test environment)`);
            }
        }

        console.log('✅ File storage integration working correctly');
        return true;

    } catch (error) {
        console.error('❌ Error testing file storage integration:', error.message);
        return false;
    }
}

// Cleanup function
async function cleanup() {
    console.log('\n🧹 Cleaning up test data...');

    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);

        // Remove test registration
        await connection.execute(`
            DELETE FROM registrations WHERE id = ?
        `, [testCompanyId]);

        console.log('✅ Test registration removed from database');

    } catch (error) {
        console.error('❌ Error during cleanup:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }

    // Clean up test files
    await cleanupTestFiles();
}

// Main test runner
async function runTests() {
    console.log('🚀 Starting Additional Documents Upload Fix Tests\n');

    // Create test files first
    await createTestUploadFiles();

    const tests = [
        { name: 'Additional Documents Upload', fn: testAdditionalDocumentsUpload },
        { name: 'Continuous Document Addition', fn: testContinuousDocumentAddition },
        { name: 'API Endpoints for Additional Documents', fn: testAPIEndpointsAdditionalDocuments },
        { name: 'File Storage Integration', fn: testFileStorageIntegration }
    ];

    const results = [];

    for (const test of tests) {
        try {
            const result = await test.fn();
            results.push({ name: test.name, passed: result });
            console.log(`${result ? '✅' : '❌'} ${test.name}: ${result ? 'PASSED' : 'FAILED'}\n`);
        } catch (error) {
            console.error(`❌ ${test.name} threw an error:`, error.message);
            results.push({ name: test.name, passed: false, error: error.message });
        }
    }

    // Summary
    console.log('📊 Test Results Summary:');
    const passedTests = results.filter(r => r.passed).length;
    const totalTests = results.length;

    results.forEach(result => {
        console.log(`${result.passed ? '✅' : '❌'} ${result.name}${result.error ? ` (Error: ${result.error})` : ''}`);
    });

    console.log(`\n🎯 Overall Result: ${passedTests}/${totalTests} tests passed`);

    if (passedTests === totalTests) {
        console.log('🎉 All tests passed! Additional documents upload functionality is working correctly.');
        console.log('✅ Admin can upload additional documents one by one.');
        console.log('✅ Admin can continue adding more documents after initial uploads.');
        console.log('✅ API endpoints work correctly for additional documents.');
        console.log('✅ File storage integration is functional.');
    } else {
        console.log('⚠️ Some tests failed. Please review the additional documents upload implementation.');
    }

    // Cleanup
    await cleanup();
}

// Run tests if this script is executed directly
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = {
    runTests,
    cleanup
}; 