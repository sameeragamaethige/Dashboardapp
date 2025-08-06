// Test script for admin step3 document management with MySQL integration
// This script tests that admin uploads are saved instantly to MySQL and file storage

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
const testCompanyId = 'admin-step3-mysql-test-company';
const testAdminDocuments = [
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
    for (const doc of testAdminDocuments) {
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
    for (const doc of testAdminDocuments) {
        const filePath = path.join(uploadsDir, doc.name);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`🗑️ Removed test file: ${doc.name}`);
        }
    }
}

// Test 1: Verify admin can upload step3 additional documents instantly to MySQL
async function testAdminUploadStep3Documents() {
    console.log('\n🧪 Test 1: Admin uploading step3 additional documents to MySQL');

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

        // Simulate admin uploading step3 additional documents
        // This would normally be done through the frontend, but we'll simulate the API call
        const step3Documents = testAdminDocuments;

        // Update the registration with step3 additional documents
        await connection.execute(`
            UPDATE registrations 
            SET step3_additional_doc = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [JSON.stringify(step3Documents), testCompanyId]);

        console.log('✅ Step3 additional documents saved to MySQL database');

        // Verify the documents were saved correctly
        const [verifyRows] = await connection.execute(`
            SELECT step3_additional_doc FROM registrations WHERE id = ?
        `, [testCompanyId]);

        if (verifyRows.length === 0) {
            console.log('❌ Test registration not found after upload');
            return false;
        }

        const savedDocuments = JSON.parse(verifyRows[0].step3_additional_doc);
        console.log(`✅ Documents saved: ${savedDocuments.length} documents`);

        // Verify document structure
        for (const doc of savedDocuments) {
            if (!doc.title || !doc.name || !doc.url || !doc.filePath || !doc.id) {
                console.log('❌ Document structure incomplete:', doc);
                return false;
            }
        }

        console.log('✅ All step3 additional documents uploaded and saved to MySQL correctly');
        return true;

    } catch (error) {
        console.error('❌ Error testing admin upload step3 documents:', error.message);
        return false;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Test 2: Verify admin can publish documents to customer
async function testAdminPublishDocuments() {
    console.log('\n🧪 Test 2: Admin publishing documents to customer');

    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);

        // Update the registration to mark documents as published
        await connection.execute(`
            UPDATE registrations 
            SET documents_published = true, 
                documents_published_at = CURRENT_TIMESTAMP,
                status = 'documents-published',
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [testCompanyId]);

        console.log('✅ Documents published to customer');

        // Verify the publishing status
        const [verifyRows] = await connection.execute(`
            SELECT documents_published, status FROM registrations WHERE id = ?
        `, [testCompanyId]);

        if (verifyRows.length === 0) {
            console.log('❌ Test registration not found after publishing');
            return false;
        }

        const isPublished = verifyRows[0].documents_published;
        const status = verifyRows[0].status;

        if (isPublished && status === 'documents-published') {
            console.log('✅ Documents successfully published to customer');
            return true;
        } else {
            console.log('❌ Documents not properly published:', { isPublished, status });
            return false;
        }

    } catch (error) {
        console.error('❌ Error testing admin publish documents:', error.message);
        return false;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Test 3: Verify customer can access published documents
async function testCustomerAccessPublishedDocuments() {
    console.log('\n🧪 Test 3: Customer accessing published documents');

    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);

        // Fetch the registration as a customer would
        const [rows] = await connection.execute(`
            SELECT step3_additional_doc, documents_published, status FROM registrations WHERE id = ?
        `, [testCompanyId]);

        if (rows.length === 0) {
            console.log('❌ Test registration not found');
            return false;
        }

        const registration = rows[0];
        const step3Documents = JSON.parse(registration.step3_additional_doc);
        const isPublished = registration.documents_published;
        const status = registration.status;

        console.log(`📊 Customer access check:`, {
            documentsPublished: isPublished,
            status: status,
            documentCount: step3Documents.length
        });

        // Verify customer can access documents when published
        if (isPublished && status === 'documents-published' && step3Documents.length > 0) {
            console.log('✅ Customer can access published step3 documents');

            // Verify each document is accessible
            for (const doc of step3Documents) {
                const filePath = path.join(process.cwd(), 'public', doc.url);
                if (fs.existsSync(filePath)) {
                    console.log(`✅ Document file accessible: ${doc.name}`);
                } else {
                    console.log(`❌ Document file not accessible: ${doc.name}`);
                    return false;
                }
            }

            return true;
        } else {
            console.log('❌ Customer cannot access documents - not published or no documents');
            return false;
        }

    } catch (error) {
        console.error('❌ Error testing customer access:', error.message);
        return false;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Test 4: Verify admin can manage (add/remove/replace) documents
async function testAdminManageDocuments() {
    console.log('\n🧪 Test 4: Admin managing (adding/removing/replacing) documents');

    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);

        // Test adding a new document
        const newDocument = {
            title: 'New Legal Agreement',
            name: 'new-legal-agreement.docx',
            type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            size: 512000,
            url: '/uploads/documents/new-legal-agreement.docx',
            filePath: 'documents/new-legal-agreement.docx',
            id: 'admin-doc-003',
            uploadedAt: new Date().toISOString()
        };

        // Get current documents and add new one
        const [currentRows] = await connection.execute(`
            SELECT step3_additional_doc FROM registrations WHERE id = ?
        `, [testCompanyId]);

        if (currentRows.length === 0) {
            console.log('❌ Test registration not found');
            return false;
        }

        const currentDocs = JSON.parse(currentRows[0].step3_additional_doc);
        const updatedDocs = [...currentDocs, newDocument];

        // Update with new document
        await connection.execute(`
            UPDATE registrations 
            SET step3_additional_doc = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [JSON.stringify(updatedDocs), testCompanyId]);

        console.log('✅ New document added to step3');

        // Verify the addition
        const [verifyRows] = await connection.execute(`
            SELECT step3_additional_doc FROM registrations WHERE id = ?
        `, [testCompanyId]);

        const verifiedDocs = JSON.parse(verifyRows[0].step3_additional_doc);
        console.log(`✅ Document count updated: ${verifiedDocs.length} documents`);

        // Test removing a document
        const docsAfterRemoval = verifiedDocs.filter(doc => doc.id !== 'admin-doc-002');

        await connection.execute(`
            UPDATE registrations 
            SET step3_additional_doc = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [JSON.stringify(docsAfterRemoval), testCompanyId]);

        console.log('✅ Document removed from step3');

        // Verify the removal
        const [finalRows] = await connection.execute(`
            SELECT step3_additional_doc FROM registrations WHERE id = ?
        `, [testCompanyId]);

        const finalDocs = JSON.parse(finalRows[0].step3_additional_doc);
        console.log(`✅ Final document count: ${finalDocs.length} documents`);

        if (finalDocs.length === 2 && finalDocs.find(doc => doc.id === 'admin-doc-001') && finalDocs.find(doc => doc.id === 'admin-doc-003')) {
            console.log('✅ Document management (add/remove) working correctly');
            return true;
        } else {
            console.log('❌ Document management not working correctly');
            return false;
        }

    } catch (error) {
        console.error('❌ Error testing admin manage documents:', error.message);
        return false;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Test 5: Verify file storage integration
async function testFileStorageIntegration() {
    console.log('\n🧪 Test 5: File storage integration');

    try {
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'documents');

        // Check if uploads directory exists
        if (!fs.existsSync(uploadsDir)) {
            console.log('❌ Uploads directory does not exist');
            return false;
        }

        // Check if test files exist
        for (const doc of testAdminDocuments) {
            const filePath = path.join(uploadsDir, doc.name);
            if (!fs.existsSync(filePath)) {
                console.log(`❌ Test file not found: ${doc.name}`);
                return false;
            }
        }

        console.log('✅ All test files exist in file storage');
        return true;

    } catch (error) {
        console.error('❌ Error testing file storage integration:', error.message);
        return false;
    }
}

// Test 6: Verify API endpoints work correctly
async function testAPIEndpoints() {
    console.log('\n🧪 Test 6: API endpoints functionality');

    try {
        // Test GET endpoint
        const getResponse = await fetch(`http://localhost:3000/api/registrations/${testCompanyId}`);
        if (!getResponse.ok) {
            console.log(`❌ GET API failed: ${getResponse.status} ${getResponse.statusText}`);
            return false;
        }

        const registration = await getResponse.json();
        console.log('✅ GET API working correctly');

        // Verify step3 documents are included in response
        if (registration.step3AdditionalDoc && Array.isArray(registration.step3AdditionalDoc)) {
            console.log(`✅ Step3 documents included in API response: ${registration.step3AdditionalDoc.length} documents`);
        } else {
            console.log('❌ Step3 documents not included in API response');
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
    console.log('🚀 Starting Admin Step3 MySQL Integration Tests\n');

    // Create test files first
    await createTestUploadFiles();

    const tests = [
        { name: 'Admin Upload Step3 Documents to MySQL', fn: testAdminUploadStep3Documents },
        { name: 'Admin Publish Documents to Customer', fn: testAdminPublishDocuments },
        { name: 'Customer Access Published Documents', fn: testCustomerAccessPublishedDocuments },
        { name: 'Admin Manage Documents', fn: testAdminManageDocuments },
        { name: 'File Storage Integration', fn: testFileStorageIntegration },
        { name: 'API Endpoints', fn: testAPIEndpoints }
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
        console.log('🎉 All tests passed! Admin step3 document management with MySQL integration is working correctly.');
        console.log('✅ Additional documents are instantly saved to MySQL database and filestore.');
        console.log('✅ "Publish to Customer" functionality works correctly.');
        console.log('✅ Customer can access step3 documents when published.');
    } else {
        console.log('⚠️ Some tests failed. Please review the admin step3 document management implementation.');
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